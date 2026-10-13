"""
build_index.py — MediFirst FAISS Index Builder (standalone script)

Run this script directly to build (or rebuild) the FAISS vector index from
the knowledge_base.json file without starting the FastAPI server.

Usage:
    python build_index.py

Output files (same directory as this script):
    firstaid.index     — FAISS binary index
    firstaid_meta.json — Parallel metadata array (chunk id, content, source, etc.)

This script is equivalent to calling POST /build on the running rag_api server.
It is useful for CI pipelines or first-time setup before the service starts.
"""

import json
import os
import sys
import numpy as np
import faiss

from sentence_transformers import SentenceTransformer

# ─────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────

BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
KB_PATH       = os.path.join(BASE_DIR, "knowledge_base.json")
INDEX_PATH    = os.path.join(BASE_DIR, "firstaid.index")
METADATA_PATH = os.path.join(BASE_DIR, "firstaid_meta.json")
MODEL_NAME    = "all-MiniLM-L6-v2"


def main():
    print("=" * 55)
    print("  MediFirst — FAISS Index Builder")
    print("=" * 55)

    # ── Load knowledge base ───────────────────
    if not os.path.exists(KB_PATH):
        print(f"[ERROR] knowledge_base.json not found at:\n  {KB_PATH}")
        sys.exit(1)

    print(f"[1/4] Loading knowledge base from: {KB_PATH}")
    with open(KB_PATH, "r", encoding="utf-8") as f:
        chunks = json.load(f)

    if not isinstance(chunks, list) or len(chunks) == 0:
        print("[ERROR] knowledge_base.json must be a non-empty JSON array.")
        sys.exit(1)

    print(f"      -> {len(chunks)} chunks loaded")

    # ── Load embedding model ──────────────────
    print(f"[2/4] Loading sentence-transformer model: {MODEL_NAME}")
    model = SentenceTransformer(MODEL_NAME)
    print(f"      -> Model loaded (embedding dim: {model.get_sentence_embedding_dimension()})")

    # ── Embed all chunks ──────────────────────
    print(f"[3/4] Embedding {len(chunks)} chunks...")
    texts      = [c["content"] for c in chunks]
    embeddings = model.encode(
        texts,
        show_progress_bar=True,
        normalize_embeddings=True,    # Normalise for cosine similarity via inner product
        batch_size=32,
    )
    embeddings = np.array(embeddings, dtype=np.float32)
    print(f"      -> Embeddings shape: {embeddings.shape}")

    # ── Build and save FAISS index ────────────
    print(f"[4/4] Building FAISS IndexFlatIP and saving...")
    dim   = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)   # Inner product on normalised vectors == cosine similarity
    index.add(embeddings)

    faiss.write_index(index, INDEX_PATH)
    with open(METADATA_PATH, "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=2, ensure_ascii=False)

    print(f"      -> Saved: {INDEX_PATH}")
    print(f"      -> Saved: {METADATA_PATH}")
    print()
    print("=" * 55)
    print(f"  [OK] Index built successfully!")
    print(f"  Chunks: {index.ntotal} | Dimension: {dim}")
    print("=" * 55)


if __name__ == "__main__":
    main()
