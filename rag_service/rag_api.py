"""
rag_api.py — MediFirst FastAPI RAG Microservice

Provides two endpoints:
  POST /retrieve  — Embeds a user query with sentence-transformers and returns
                    the top-k most semantically similar first-aid knowledge chunks
                    from the pre-built FAISS index.

  POST /build     — Reads knowledge_base.json, embeds all chunks, and writes
                    a new FAISS index to firstaid.index. Call this once at
                    startup or whenever the knowledge base is updated.

Run with:
  uvicorn rag_api:app --host 0.0.0.0 --port 8000 --reload

Requirements: see requirements.txt
"""

import json
import os
import time
import numpy as np
import faiss

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from contextlib import asynccontextmanager

# ─────────────────────────────────────────────
# Constants
# ─────────────────────────────────────────────

MODEL_NAME        = "all-MiniLM-L6-v2"
KB_PATH           = os.path.join(os.path.dirname(__file__), "knowledge_base.json")
INDEX_PATH        = os.path.join(os.path.dirname(__file__), "firstaid.index")
METADATA_PATH     = os.path.join(os.path.dirname(__file__), "firstaid_meta.json")

# ─────────────────────────────────────────────
# State (loaded at startup)
# ─────────────────────────────────────────────

state = {
    "model":    None,
    "index":    None,
    "metadata": [],   # list of chunk dicts parallel to FAISS vectors
}

# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def load_model() -> SentenceTransformer:
    print(f"[rag_api] Loading sentence-transformer model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)
    print(f"[rag_api] Model loaded successfully")
    return model


def build_faiss_index(chunks: list[dict], model: SentenceTransformer) -> faiss.IndexFlatIP:
    """
    Embeds all chunks and builds a FAISS IndexFlatIP (inner product / cosine similarity).
    Returns the index and saves both the .index file and a metadata JSON sidecar.
    """
    print(f"[rag_api] Building FAISS index from {len(chunks)} chunks...")
    texts = [c["content"] for c in chunks]
    embeddings = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
    embeddings = np.array(embeddings, dtype=np.float32)

    dim   = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)   # Inner product on normalised vectors == cosine similarity
    index.add(embeddings)

    faiss.write_index(index, INDEX_PATH)
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=2)

    print(f"[rag_api] FAISS index saved -> {INDEX_PATH} | vectors={index.ntotal} | dim={dim}")
    return index


def load_faiss_index() -> tuple[faiss.IndexFlatIP | None, list]:
    if not os.path.exists(INDEX_PATH) or not os.path.exists(METADATA_PATH):
        print(f"[rag_api] FAISS index files not found - will build on first /build call")
        return None, []

    print(f"[rag_api] Loading FAISS index from {INDEX_PATH}")
    index = faiss.read_index(INDEX_PATH)
    with open(METADATA_PATH, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    print(f"[rag_api] Index loaded | vectors={index.ntotal}")
    return index, metadata


# ─────────────────────────────────────────────
# Lifespan (startup / shutdown)
# ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[rag_api] Starting up MediFirst RAG service...")
    state["model"] = load_model()
    state["index"], state["metadata"] = load_faiss_index()

    # Auto-build index if it doesn't exist yet
    if state["index"] is None:
        if os.path.exists(KB_PATH):
            print("[rag_api] Auto-building index from knowledge_base.json on first startup...")
            with open(KB_PATH, "r", encoding="utf-8") as f:
                chunks = json.load(f)
            state["index"] = build_faiss_index(chunks, state["model"])
            state["metadata"] = chunks
        else:
            print(f"[rag_api] WARNING: {KB_PATH} not found. POST /build to create the index.")

    # Warm the embedding pipeline once so the first real /retrieve does not
    # pay the cold-start cost of the sentence-transformer forward pass.
    print("[rag_api] Warming up embedding model...")
    warm_start = time.time()
    state["model"].encode(["warmup query"], show_progress_bar=False, normalize_embeddings=True)
    print(f"[rag_api] Warmup complete ({(time.time() - warm_start) * 1000:.0f}ms)")

    print("[rag_api] RAG service ready [OK]")
    yield
    print("[rag_api] Shutting down RAG service...")


# ─────────────────────────────────────────────
# App
# ─────────────────────────────────────────────

app = FastAPI(
    title="MediFirst RAG Service",
    description="FAISS-based semantic retrieval for first-aid knowledge chunks",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Request / Response Models
# ─────────────────────────────────────────────

class RetrieveRequest(BaseModel):
    query: str
    top_k: int = 3


class ChunkResult(BaseModel):
    id:            str
    emergencyType: str
    content:       str
    source:        str
    urgencyLevel:  str
    score:         float


class RetrieveResponse(BaseModel):
    query:   str
    top_k:   int
    results: list[ChunkResult]
    latency_ms: float


class BuildResponse(BaseModel):
    success:      bool
    message:      str
    chunks_built: int


# ─────────────────────────────────────────────
# Endpoints
# ─────────────────────────────────────────────

@app.get("/health")
def health():
    """Health check for the RAG microservice."""
    return {
        "status":        "ok",
        "model":         MODEL_NAME,
        "index_loaded":  state["index"] is not None,
        "chunks_indexed": state["index"].ntotal if state["index"] else 0,
    }


@app.post("/retrieve", response_model=RetrieveResponse)
def retrieve(request: RetrieveRequest):
    """
    Embeds the query and returns the top-k most similar knowledge chunks.
    """
    print(f"[rag_api] /retrieve called | top_k={request.top_k} | query='{request.query[:60]}...'")
    start = time.time()

    if state["index"] is None:
        raise HTTPException(
            status_code=503,
            detail="FAISS index not loaded. Call POST /build first."
        )

    if not request.query or len(request.query.strip()) < 2:
        raise HTTPException(status_code=400, detail="query must be at least 2 characters.")

    top_k = max(1, min(request.top_k, 10))

    try:
        query_vec = state["model"].encode(
            [request.query],
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        query_vec = np.array(query_vec, dtype=np.float32)

        distances, indices = state["index"].search(query_vec, top_k)

        results: list[ChunkResult] = []
        for rank, (score, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < 0 or idx >= len(state["metadata"]):
                continue
            chunk = state["metadata"][idx]
            results.append(
                ChunkResult(
                    id=chunk.get("id", f"chunk_{idx}"),
                    emergencyType=chunk.get("emergencyType", "general"),
                    content=chunk.get("content", ""),
                    source=chunk.get("source", "Unknown"),
                    urgencyLevel=chunk.get("urgencyLevel", "MODERATE"),
                    score=float(score),
                )
            )

        latency_ms = (time.time() - start) * 1000
        print(f"[rag_api] /retrieve complete | results={len(results)} | latency={latency_ms:.1f}ms")

        return RetrieveResponse(
            query=request.query,
            top_k=top_k,
            results=results,
            latency_ms=round(latency_ms, 2),
        )

    except Exception as e:
        print(f"[rag_api] /retrieve error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/build", response_model=BuildResponse)
def build_index():
    """
    Reads knowledge_base.json, embeds all chunks, and rebuilds the FAISS index.
    Safe to call while the service is running.
    """
    print(f"[rag_api] /build called — rebuilding FAISS index from {KB_PATH}")

    if not os.path.exists(KB_PATH):
        raise HTTPException(
            status_code=404,
            detail=f"knowledge_base.json not found at {KB_PATH}"
        )

    try:
        with open(KB_PATH, "r", encoding="utf-8") as f:
            chunks = json.load(f)

        if not isinstance(chunks, list) or len(chunks) == 0:
            raise ValueError("knowledge_base.json must contain a non-empty JSON array.")

        new_index = build_faiss_index(chunks, state["model"])

        # Hot-swap the in-memory index
        state["index"]    = new_index
        state["metadata"] = chunks

        msg = f"FAISS index rebuilt successfully with {len(chunks)} chunks."
        print(f"[rag_api] /build complete: {msg}")
        return BuildResponse(success=True, message=msg, chunks_built=len(chunks))

    except Exception as e:
        print(f"[rag_api] /build error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
