"use client";

import { useId, useRef, useState } from "react";
import { IconAlert, IconCamera, IconSwap, IconTrash } from "./icons";
import { Spinner } from "./ui/Button";

type Props = {
  titulo: string;
  descricao: string;
  previewUrl: string | null;
  erro: string | null;
  verificando?: boolean;
  desativado?: boolean;
  onArquivo: (f: File) => void;
  onRemover: () => void;
};

/** Área de upload · estados: vazia, arrastando, com foto, erro. */
export function UploadZone({ titulo, descricao, previewUrl, erro, verificando, desativado, onArquivo, onRemover }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [arrastando, setArrastando] = useState(false);
  const profundidade = useRef(0);

  const escolher = (files: FileList | null) => {
    const f = files?.[0];
    if (f) onArquivo(f);
    if (inputRef.current) inputRef.current.value = "";
  };

  const estado = erro ? "erro" : previewUrl ? "foto" : arrastando ? "arrastando" : "vazia";

  return (
    <div className="upload">
      <div className="upload-head">
        <h2 className="card-title">{titulo}</h2>
        <p className="caption">{descricao}</p>
      </div>

      <div
        className={`upload-zone upload-${estado}`}
        onDragEnter={(e) => {
          e.preventDefault();
          profundidade.current++;
          setArrastando(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={() => {
          profundidade.current = Math.max(0, profundidade.current - 1);
          if (profundidade.current === 0) setArrastando(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          profundidade.current = 0;
          setArrastando(false);
          if (!desativado) escolher(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png"
          className="sr-only upload-input"
          disabled={desativado}
          aria-describedby={erro ? `${id}-erro` : undefined}
          aria-invalid={!!erro || undefined}
          onChange={(e) => escolher(e.target.files)}
        />

        {previewUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:) */}
            <img src={previewUrl} alt={`Prévia: ${titulo.toLowerCase()}`} className="upload-img" />
            {verificando && (
              <div className="upload-overlay">
                <Spinner /> Verificando foto…
              </div>
            )}
            <div className="upload-actions">
              <label htmlFor={id} className="btn btn-sm btn-photo" aria-disabled={desativado || undefined}>
                <IconSwap />
                <span>Trocar foto</span>
              </label>
              <button
                type="button"
                className="btn btn-sm btn-icon btn-photo"
                aria-label={`Remover foto do ${titulo.toLowerCase()}`}
                title="Remover foto"
                onClick={onRemover}
                disabled={desativado}
              >
                <IconTrash />
              </button>
            </div>
          </>
        ) : (
          <label htmlFor={id} className="upload-empty">
            <span className="upload-icon" aria-hidden="true">
              {erro ? <IconAlert size={22} /> : <IconCamera size={22} />}
            </span>
            <span className="upload-cta">
              {arrastando ? "Solte a foto aqui" : "Arraste a foto ou clique para escolher"}
            </span>
            <span className="caption">JPG ou PNG, até 10 MB</span>
          </label>
        )}
      </div>

      {erro && (
        <p id={`${id}-erro`} className="upload-msg-erro" role="alert">
          <IconAlert size={14} /> {erro}
        </p>
      )}
    </div>
  );
}
