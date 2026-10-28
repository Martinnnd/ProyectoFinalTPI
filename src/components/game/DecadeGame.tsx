"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2, ImageOff, RotateCcw, Trophy, XCircle } from "lucide-react";
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

export default function DecadeGame() {
  const [questions, setQuestions] = useState<DecadeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedDecade, setSelectedDecade] = useState<Decade | null>(null);
  const [score, setScore] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setQuestions(createGameQuestions());
  }, []);

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
    setQuestions(createGameQuestions());
    setCurrentIndex(0);
    setSelectedDecade(null);
    setScore(0);
    setImageFailed(false);
  }

  if (questions.length === 0) {
    return (
      <main className={styles.page} aria-busy="true">
        <p className={styles.loading} role="status">
          Preparando la partida…
        </p>
      </main>
    );
  }

  if (finished) {
    const won = isWinningScore(score);

    return (
      <main className={styles.page}>
        <section className={styles.resultCard} aria-labelledby="game-result-title">
          <div className={`${styles.resultIcon} ${won ? styles.won : styles.lost}`}>
            {won ? <Trophy aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
          </div>
          <p className={styles.eyebrow}>Partida terminada</p>
          <h1 id="game-result-title">
            {won ? "¡Ganaste!" : "Estuviste cerca"}
          </h1>
          <p className={styles.finalScore}>
            Acertaste <strong>{score} de {GAME_LENGTH}</strong> fotografías.
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
          <div className={styles.progress} aria-label={`Pregunta ${currentIndex + 1} de ${GAME_LENGTH}`}>
            <strong>{currentIndex + 1}</strong>
            <span>/ {GAME_LENGTH}</span>
          </div>
        </header>

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
              priority={currentIndex === 0}
              sizes="(max-width: 899px) 100vw, 760px"
              className={styles.photo}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className={styles.missingImage} role="alert">
              <ImageOff size={40} aria-hidden="true" />
              <strong>Falta cargar esta fotografía</strong>
              <span>
                Agregá <code>{currentQuestion.decade}.jpg</code> en <code>public/juego-decadas</code>.
              </span>
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
