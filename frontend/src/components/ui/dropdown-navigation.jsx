import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";

/**
 * Animated dropdown navigation bar — MediFirst design tokens.
 * Centre this inside the sticky header between the brand and CTA buttons.
 */
export function DropdownNavigation({ navItems }) {
  const [openMenu, setOpenMenu] = React.useState(null);
  const [isHover, setIsHover] = useState(null);

  const handleHover = (menuLabel) => setOpenMenu(menuLabel);

  return (
    <nav aria-label="Main Navigation" className="relative flex items-center justify-center">
      <ul className="relative flex items-center space-x-0.5">
        {navItems.map((navItem) => (
          <li
            key={navItem.label}
            className="relative"
            onMouseEnter={() => handleHover(navItem.label)}
            onMouseLeave={() => handleHover(null)}
          >
            <button
              type="button"
              onClick={() => navItem.link && (window.location.href = navItem.link)}
              className="text-sm py-2 px-3.5 flex cursor-pointer transition-colors duration-200 items-center justify-center gap-1.5 text-slate-500 hover:text-carbon relative rounded-full"
              onMouseEnter={() => setIsHover(navItem.id)}
              onMouseLeave={() => setIsHover(null)}
              aria-haspopup={navItem.subMenus ? "true" : undefined}
              aria-expanded={openMenu === navItem.label ? "true" : undefined}
            >
              <span className="relative z-10 font-medium text-[13px]">{navItem.label}</span>
              {navItem.subMenus && (
                <ChevronDown
                  className={`h-3.5 w-3.5 relative z-10 duration-300 transition-transform text-slate-400 ${
                    openMenu === navItem.label ? "rotate-180 text-carbon" : ""
                  }`}
                />
              )}
              {(isHover === navItem.id || openMenu === navItem.label) && (
                <motion.div
                  layoutId="nav-hover-bg"
                  className="absolute inset-0 size-full bg-slate-100 rounded-full"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                />
              )}
            </button>

            <AnimatePresence>
              {openMenu === navItem.label && navItem.subMenus && (
                <div className="w-auto absolute left-0 top-full pt-2.5 z-50">
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="bg-white border border-slate-200/80 p-4 w-max shadow-elevated rounded-2xl"
                  >
                    <div className="w-fit shrink-0 flex space-x-8 overflow-hidden">
                      {navItem.subMenus.map((sub) => (
                        <motion.div layout className="w-full min-w-[160px]" key={sub.title}>
                          <h3 className="mb-3.5 text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400">
                            {sub.title}
                          </h3>
                          <ul className="space-y-0.5">
                            {sub.items.map((item) => {
                              const Icon = item.icon;
                              return (
                                <li key={item.label}>
                                  <a
                                    href={item.href || "#"}
                                    className="flex items-start space-x-3 group/link p-2 -mx-1.5 rounded-xl transition-colors hover:bg-slate-50"
                                  >
                                    <div className="border border-slate-200/80 text-slate-600 rounded-lg flex items-center justify-center size-8 shrink-0 group-hover/link:bg-crimson-50 group-hover/link:border-red-200/60 group-hover/link:text-crimson-700 transition-colors duration-200">
                                      <Icon className="h-4 w-4 flex-none" />
                                    </div>
                                    <div className="leading-5">
                                      <p className="text-[13px] font-semibold text-carbon shrink-0">
                                        {item.label}
                                      </p>
                                      <p className="text-[11px] text-slate-400 shrink-0 group-hover/link:text-slate-600 transition-colors duration-200 mt-0.5 leading-tight">
                                        {item.description}
                                      </p>
                                    </div>
                                  </a>
                                </li>
                              );
                            })}
                          </ul>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </li>
        ))}
      </ul>
    </nav>
  );
}
