"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, ExternalLink, ImageOff, RotateCcw, Trophy, XCircle } from "lucide-react";
import type { Decade } from "../../types";
import {
  createGameQuestions,
  decadeOptions,
  formatDecade,
  GAME_LENGTH,
  isWinningScore,
  type DecadeQuestion,
} from "./decadeQuestions";
import styles from "./DecadeGame.module.css";
import { getPublicationDecadePhotos } from "./decadePhotosApi";

export default function DecadeGame({ localQuestions }: { localQuestions: DecadeQuestion[] }) {
  const localCatalog = useRef(localQuestions);
  localCatalog.current = localQuestions;
  const [questions, setQuestions] = useState<DecadeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDecade, setSelectedDecade] = useState<Decade | null>(null);
  const [score, setScore] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [communityUnavailable, setCommunityUnavailable] = useState(false);
  const [round, setRound] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    setLoading(true);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedDecade(null);
    setScore(0);
    setImageFailed(false);
    setCommunityUnavailable(false);
    async function prepare() {
      let community: DecadeQuestion[] = [];
      try {
        community = await getPublicationDecadePhotos(controller.signal);
      } catch {
        if (!cancelled) setCommunityUnavailable(true);
      } finally {
        clearTimeout(timeout);
      }
      if (cancelled) return;
      setQuestions(createGameQuestions([...localCatalog.current, ...community]));
      setLoading(false);
    }
    void prepare();
    return () => {
      cancelled = true;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [round]);

  const finished = questions.length > 0 && currentIndex >= questions.length;
  const currentQuestion = questions[currentIndex];
  const answered = selectedDecade !== null;
  const correct = answered && selectedDecade === currentQuestion?.decade;

  function answer(decade: Decade) {
    if (answered || !currentQuestion || imageFailed) return;

    setSelectedDecade(decade);
    if (decade === currentQuestion.decade) {
      setScore((currentScore) => currentScore + 1);
    }
  }

  function nextQuestion() {
    setCurrentIndex((index) => index + 1);
    setSelectedDecade(null);
    setImageFailed(false);
  }

  function restart() {
    setRound((value) => value + 1);
  }

  if (loading) {
    return (
      <main className={styles.page} aria-busy="true">
        <p className={styles.loading} role="status">
          Preparando la partida…
        </p>
      </main>
    );
  }

  if (questions.length < GAME_LENGTH)
    return (
      <main className={styles.page}>
        <section className={styles.resultCard}>
          <h1>Todavía faltan fotos para jugar</h1>
          <p>Necesitamos al menos {GAME_LENGTH} fotos disponibles para armar una partida.</p>
          <button className={styles.primaryAction} type="button" onClick={restart}>
            Volver a intentar
          </button>
        </section>
      </main>
    );

  if (finished) {
    const won = isWinningScore(score);

    return (
      <main className={styles.page}>
        <section className={styles.resultCard} aria-labelledby="game-result-title">
          <div className={`${styles.resultIcon} ${won ? styles.won : styles.lost}`}>
            {won ? <Trophy aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
          </div>
          <p className={styles.eyebrow}>Partida terminada</p>
          <h1 id="game-result-title">{won ? "¡Ganaste!" : "Estuviste cerca"}</h1>
          <p className={styles.finalScore}>
            Acertaste{" "}
            <strong>
              {score} de {GAME_LENGTH}
            </strong>{" "}
            fotografías.
          </p>
          <p className={styles.resultMessage}>
            {won
              ? "Reconociste al menos cuatro décadas. ¡Excelente memoria!"
              : "Necesitás cuatro aciertos para ganar. Probá una nueva partida."}
          </p>
          <button className={styles.primaryAction} type="button" onClick={restart}>
            <RotateCcw size={18} aria-hidden="true" />
            Jugar de nuevo
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.gameCard} aria-labelledby="game-title">
        <header className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>Desafío temporal</p>
            <h1 id="game-title">¿De qué década es esta foto?</h1>
          </div>
          <div
            className={styles.progress}
            aria-label={`Pregunta ${currentIndex + 1} de ${GAME_LENGTH}`}
          >
            <strong>{currentIndex + 1}</strong>
            <span>/ {GAME_LENGTH}</span>
          </div>
        </header>

        {communityUnavailable && (
          <p className={styles.catalogNotice} role="status">
            Las publicaciones no están disponibles ahora. Esta partida usa las fotos del archivo.
          </p>
        )}

        <div className={styles.progressTrack} aria-hidden="true">
          <span style={{ width: `${((currentIndex + 1) / GAME_LENGTH) * 100}%` }} />
        </div>

        <div className={styles.photoFrame}>
          {!imageFailed ? (
            <Image
              key={currentQuestion.id}
              src={currentQuestion.image}
              alt={`Fotografía para identificar, pregunta ${currentIndex + 1} de ${GAME_LENGTH}`}
              fill
              unoptimized={currentQuestion.source === "publication"}
              priority={currentIndex === 0}
              sizes="(max-width: 899px) 100vw, 760px"
              className={styles.photo}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className={styles.missingImage} role="alert">
              <ImageOff size={40} aria-hidden="true" />
              <strong>No pudimos cargar esta fotografía</strong>
              <span>Podés continuar con otra foto.</span>
              <button type="button" onClick={nextQuestion}>
                Omitir esta foto
              </button>
            </div>
          )}
        </div>

        <fieldset className={styles.options} disabled={answered || imageFailed}>
          <legend>Elegí una década</legend>
          <div className={styles.optionGrid}>
            {decadeOptions.map((decade) => {
              const selected = selectedDecade === decade;
              const isAnswer = answered && currentQuestion.decade === decade;
              const isWrongSelection = selected && !isAnswer;

              return (
                <button
                  key={decade}
                  type="button"
                  className={`${styles.option} ${isAnswer ? styles.correctOption : ""} ${isWrongSelection ? styles.wrongOption : ""}`}
                  onClick={() => answer(decade)}
                  aria-pressed={selected}
                  aria-label={formatDecade(decade)}
                >
                  <span className={styles.fullDecade}>{formatDecade(decade)}</span>
                  <span className={styles.shortDecade} aria-hidden="true">
                    {decade < 2000 ? String(decade).slice(2) : decade}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {answered && (
          <div
            className={`${styles.feedback} ${correct ? styles.correctFeedback : styles.wrongFeedback}`}
            role="status"
            aria-live="polite"
          >
            {correct ? <CheckCircle2 aria-hidden="true" /> : <XCircle aria-hidden="true" />}
            <div>
              <strong>{correct ? "¡Correcto!" : "Respuesta incorrecta"}</strong>
              <span>
                {correct
                  ? `La fotografía pertenece a los ${formatDecade(currentQuestion.decade).toLowerCase()}.`
                  : `La respuesta era ${formatDecade(currentQuestion.decade).toLowerCase()}.`}
              </span>
              {currentQuestion.source === "publication" && (
                <a
                  className={styles.publicationLink}
                  href={`/recuerdo/${currentQuestion.publicationId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Ver publicación (se abre en otra pestaña)"
                >
                  Ver publicación <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
            </div>
            <button type="button" onClick={nextQuestion}>
              {currentIndex === GAME_LENGTH - 1 ? "Ver resultado" : "Siguiente foto"}
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
