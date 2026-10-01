# TiemPo

Juego para practicar las **conversiones entre unidades de tiempo**:

- **Unidades cortas:** semana, día, hora, minuto y segundo (× 7, × 24, × 60, × 60).
- **Unidades largas:** milenio, siglo, década, lustro, año, semestre y trimestre.

En cada pregunta hay que elegir **qué operaciones** convierten una cantidad de una unidad a otra; por ejemplo, para pasar 3 días a minutos: «× 24 horas × 60 minutos» (resultado: 4.320 minutos). Así se entiende el cambio, no solo se memoriza el resultado.

**Web:** https://voodatari.github.io/tiempo5/

Funciona en el navegador, sin instalar nada, con estética de viaje en el tiempo. Es el hermano de [MetriKa](https://github.com/voodatari/metrikamv), el juego del sistema métrico decimal.

## Modos de juego

| Modo | Cómo se juega |
|---|---|
| ⏱️ **Contrarreloj** | Tantos aciertos como se pueda en 15, 30, 45 o 60 segundos. |
| 💀 **Muerte súbita** | Sin tiempo: un error y se acaba. |
| ❤️ **Supervivencia** | Tres vidas y un reloj por pregunta que se acelera según se acierta. |
| 🎓 **Entrenamiento** | Sin presión, para aprender a moverse por la escala. |

Durante la partida se puede desplegar la **tabla de conversión**. Antes de jugar se escribe el nombre del jugador. Al terminar se ve el análisis de la partida y el **ranking** («Mejores agentes»), que se guarda en el propio navegador.

## Opciones

- Música activada o desactivada.
- Tres fondos animados: flujo de arena, campo de relojes o túnel del tiempo.

## Cómo está hecho

HTML, CSS y JavaScript sin frameworks ni compilación: lo que hay en el repositorio es exactamente lo que se publica.

| Archivo | Qué hace |
|---|---|
| `index.html`, `style.css` | Todas las pantallas y sus estilos |
| `app.js` | Todo el juego: preguntas, modos, ranking, sonidos y fondos animados |
| `bucle.js` | Música en bucle; en Chrome se repite sin cortes con Web Audio |
| `music/` | Música de cada modo |

### Probarlo en local

Hay que servir la carpeta con un servidor web (por ejemplo, la extensión *Live Server* de VS Code, `npx serve .` o `python -m http.server 8080`).

## Créditos de terceros

- Tipografías [Cinzel](https://fonts.google.com/specimen/Cinzel), [Cinzel Decorative](https://fonts.google.com/specimen/Cinzel+Decorative) y [Montserrat](https://fonts.google.com/specimen/Montserrat) (SIL Open Font License), de Google Fonts.
- Música de bancos de música libre de derechos.

---

Hecho por profe Dani.
