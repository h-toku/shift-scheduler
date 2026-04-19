"use client";

import { useState } from "react";

type ModalPanelProps = {
  buttonLabel: string;
  title: string;
  children: React.ReactNode;
};

export default function ModalPanel({ buttonLabel, title, children }: ModalPanelProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-2xl bg-orange-500 px-5 py-3 text-sm font-black text-white hover:bg-orange-600"
      >
        {buttonLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/35 p-4">
          <div className="w-full max-w-2xl rounded-[32px] border border-orange-100 bg-white p-8 shadow-2xl shadow-orange-950/10">
            <div className="mb-6 flex items-start justify-between gap-4">
              <h3 className="text-2xl font-black text-stone-800">{title}</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl border border-orange-100 px-4 py-2 text-sm font-bold text-stone-500 hover:text-orange-600"
              >
                閉じる
              </button>
            </div>
            {children}
          </div>
        </div>
      ) : null}
    </>
  );
}
