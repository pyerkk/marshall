
/* ============================================================
   script.js — Управление аудио и прогрессом для bio-link страницы
   Эстетика: dark anime / hacker / dead inside
   ВСЕ КОММЕНТАРИИ И ИНСТРУКЦИИ НА РУССКОМ ЯЗЫКЕ
   ============================================================ */

/* ------------------------------------------------------------
   БЛОК КОНФИГУРАЦИИ (ЗАМЕНИТЕ ПОД СВОИ НУЖДЫ)
------------------------------------------------------------ */
const CONFIG = {
  // Путь к аудиофайлу (лежит в папке assets/)
  audioPath: './assets/track.mp3',
  
  // Название трека (отображается в виджете)
  trackTitle: 'Название трека',
  
  // Имя исполнителя
  trackArtist: 'Исполнитель',
  
  // Элементы DOM (идентификаторы из index.html)
  elements: {
    playBtn: 'playBtn',
    iconPlay: '.icon-play',
    iconPause: '.icon-pause',
    progressContainer: 'progressContainer',
    progressBar: 'progressBar',
    progressThumb: 'progressThumb',
    currentTime: 'currentTime',
    totalTime: 'totalTime',
    trackTitle: 'trackTitle',
    trackArtist: 'trackArtist'
  }
};

/* ------------------------------------------------------------
   ИНИЦИАЛИЗАЦИЯ АУДИО И СОСТОЯНИЯ
------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  // Создаём аудио-объект через нативный Audio API
  const audio = new Audio(CONFIG.audioPath);
  audio.preload = 'metadata'; // Загружаем только метаданные для быстрого старта

  // Получаем ссылки на DOM-элементы
  const playBtn = document.getElementById(CONFIG.elements.playBtn);
  const iconPlay = document.querySelector(CONFIG.elements.iconPlay);
  const iconPause = document.querySelector(CONFIG.elements.iconPause);
  const progressContainer = document.getElementById(CONFIG.elements.progressContainer);
  const progressBar = document.getElementById(CONFIG.elements.progressBar);
  const progressThumb = document.getElementById(CONFIG.elements.progressThumb);
  const currentTimeEl = document.getElementById(CONFIG.elements.currentTime);
  const totalTimeEl = document.getElementById(CONFIG.elements.totalTime);
  const trackTitleEl = document.getElementById(CONFIG.elements.trackTitle);
  const trackArtistEl = document.getElementById(CONFIG.elements.trackArtist);

  // Устанавливаем текст трека и исполнителя из конфигурации
  trackTitleEl.textContent = CONFIG.trackTitle;
  trackArtistEl.textContent = CONFIG.trackArtist;

  // Переменная для отслеживания состояния воспроизведения
  let isPlaying = false;
  // Переменная для хранения ID кадра анимации
  let animationFrameId = null;
  // Переменная для флага перетаскивания ползунка
  let isDragging = false;

  /* ------------------------------------------------------------
     ФОРМАТИРОВАНИЕ ВРЕМЕНИ (секунды -> мм:сс)
  ------------------------------------------------------------ */
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  /* ------------------------------------------------------------
     ОБНОВЛЕНИЕ ПРОГРЕСС-БАРА С ИСПОЛЬЗОВАНИЕМ requestAnimationFrame
     Анимируем только transform: scaleX для плавности (60fps)
  ------------------------------------------------------------ */
  function updateProgress() {
    if (audio.duration && !isDragging) {
      const progress = audio.currentTime / audio.duration;
      // Используем transform: scaleX для аппаратного ускорения
      progressBar.style.transform = `scaleX(${progress})`;
      
      // Позиционируем ползунок (через transform, не left)
      const containerWidth = progressContainer.offsetWidth;
      const thumbX = progress * containerWidth;
      progressThumb.style.transform = `translate(-50%, -50%) translateX(${thumbX}px)`;
      
      // Обновляем таймстампы
      currentTimeEl.textContent = formatTime(audio.currentTime);
      totalTimeEl.textContent = formatTime(audio.duration);
    }
    
    // Продолжаем цикл анимации
    animationFrameId = requestAnimationFrame(updateProgress);
  }

  /* ------------------------------------------------------------
     ЗАПУСК / ОСТАНОВКА ЦИКЛА АНИМАЦИИ
  ------------------------------------------------------------ */
  function startAnimationLoop() {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(updateProgress);
  }

  function stopAnimationLoop() {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    // Финальное обновление без цикла
    if (audio.duration) {
      const progress = audio.currentTime / audio.duration;
      progressBar.style.transform = `scaleX(${progress})`;
      currentTimeEl.textContent = formatTime(audio.currentTime);
      totalTimeEl.textContent = formatTime(audio.duration);
    }
  }

  /* ------------------------------------------------------------
     ПЕРЕКЛЮЧЕНИЕ ИКОНКИ PLAY/PAUSE
  ------------------------------------------------------------ */
  function setPlayingState(playing) {
    isPlaying = playing;
    if (playing) {
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
      playBtn.setAttribute('aria-label', 'Пауза');
    } else {
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
      playBtn.setAttribute('aria-label', 'Воспроизвести');
    }
  }

  /* ------------------------------------------------------------
     ОБРАБОТЧИК КЛИКА ПО КНОПКЕ PLAY/PAUSE
  ------------------------------------------------------------ */
  playBtn.addEventListener('click', () => {
    if (isPlaying) {
      // Ставим на паузу
      audio.pause();
      setPlayingState(false);
      stopAnimationLoop();
    } else {
      // Запускаем воспроизведение
      audio.play().then(() => {
        setPlayingState(true);
        startAnimationLoop();
      }).catch(err => {
        console.error('Ошибка воспроизведения:', err);
      });
    }
  });

  /* ------------------------------------------------------------
     ОБРАБОТЧИКИ СОБЫТИЙ АУДИО
  ------------------------------------------------------------ */
  // Когда метаданные загружены — обновляем общее время
  audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
    // Обновляем прогресс один раз
    if (audio.duration) {
      progressBar.style.transform = `scaleX(0)`;
      currentTimeEl.textContent = '0:00';
    }
  });

  // Когда трек закончился — сбрасываем состояние
  audio.addEventListener('ended', () => {
    setPlayingState(false);
    stopAnimationLoop();
    progressBar.style.transform = `scaleX(0)`;
    currentTimeEl.textContent = '0:00';
    audio.currentTime = 0;
  });

  // Обработка ошибок загрузки
  audio.addEventListener('error', (e) => {
    console.error('Ошибка загрузки аудиофайла. Проверьте путь:', CONFIG.audioPath);
    setPlayingState(false);
    stopAnimationLoop();
  });

  /* ------------------------------------------------------------
     ПЕРЕТАСКИВАНИЕ ПОЛЗУНКА ПРОГРЕССА (опционально)
     Используем pointer events для поддержки мыши и тача
  ------------------------------------------------------------ */
  progressContainer.addEventListener('pointerdown', (e) => {
    isDragging = true;
    progressContainer.setPointerCapture(e.pointerId);
    // Обновляем позицию при клике/тапе
    updateProgressFromPointer(e);
  });

  progressContainer.addEventListener('pointermove', (e) => {
    if (isDragging) {
      updateProgressFromPointer(e);
    }
  });

  progressContainer.addEventListener('pointerup', (e) => {
    if (isDragging) {
      isDragging = false;
      // Если трек играет — возобновляем цикл
      if (isPlaying) {
        startAnimationLoop();
      }
    }
  });

  progressContainer.addEventListener('pointercancel', () => {
    isDragging = false;
    if (isPlaying) {
      startAnimationLoop();
    }
  });

  // Функция пересчёта прогресса на основе позиции указателя
  function updateProgressFromPointer(e) {
    const rect = progressContainer.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    x = Math.max(0, Math.min(1, x)); // Ограничиваем 0..1
    
    if (audio.duration) {
      audio.currentTime = x * audio.duration;
      // Сразу обновляем визуал (без цикла)
      progressBar.style.transform = `scaleX(${x})`;
      const thumbX = x * rect.width;
      progressThumb.style.transform = `translate(-50%, -50%) translateX(${thumbX}px)`;
      currentTimeEl.textContent = formatTime(audio.currentTime);
    }
  }

  /* ------------------------------------------------------------
     ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
  ------------------------------------------------------------ */
  // Устанавливаем начальное состояние иконок
  setPlayingState(false);
  
  // Пытаемся загрузить метаданные
  audio.load();
  
  // Простое логирование для проверки
  console.log('Аудио инициализировано. Путь к файлу:', CONFIG.audioPath);
});
