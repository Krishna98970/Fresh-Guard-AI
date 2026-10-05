"use client";
import { X } from "lucide-react";
export default function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) { return <div className="modal-backdrop" onClick={onClose}><div className="modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}><div className="modal-header"><h2>{title}</h2><button className="icon-button" aria-label="Close" onClick={onClose}><X size={18} /></button></div>{children}</div></div>; }
