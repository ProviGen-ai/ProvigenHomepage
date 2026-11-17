"use client";

import { useId, useRef } from "react";
import type React from "react";
import GetAccess from "./GetAccess";

/*
 * "Try SDM-1" opens the Get access form as a card over the page (founder, 16 Nov 2026: the form moved from the call to
 * action to the click on "Try SDM-1" at the top). A native modal <dialog>: the close button at its corner closes it,
 * and focus returns to the trigger. A click on the backdrop does not (the user, 17 Nov 2026): the card can hold a
 * token shown only once, and a stray click beside it used to take that away. Escape still closes it, which a modal
 * dialog owes a keyboard. The form keeps its state while the card is closed, so an issued token stays visible if the
 * card is opened again during the visit.
 */
export default function GetAccessCard({
  modelName,
  className,
  children,
}: {
  modelName: string;
  /** The trigger's class, so it looks like the link it replaces. */
  className?: string;
  children: React.ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  /* Two cards on the page (the top and the call to action): each its own title id. */
  const title = useId();
  return (
    <>
      <button
        type="button"
        className={className}
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        {children}
      </button>
      <dialog
        ref={dialog}
        className="r-access-card"
        aria-labelledby={title}
      >
        <div className="r-access-card-head">
          <h2 id={title}>Get access</h2>
          <button
            type="button"
            className="r-access-card-close"
            aria-label="Close"
            onClick={() => dialog.current?.close()}
          >
            ×
          </button>
        </div>
        {/* Was "Try {modelName} from your own code with a personal token: 50 calls a day, 500 in total." (founder,
            16 Nov 2026) */}
        <p className="r-access-card-lead">Try {modelName} via API.</p>
        <GetAccess modelName={modelName} />
      </dialog>
    </>
  );
}
