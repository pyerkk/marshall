/* ============================================================
   script.js — Управление аудио, прогрессом, дождём и анимацией
   Эстетика: dark anime / hacker / dead inside
   ВСЕ КОММЕНТАРИИ НА РУССКОМ ЯЗЫКЕ
   ============================================================ */

/* ------------------------------------------------------------
   БЛОК КОНФИГУРАЦИИ (ЗАМЕНИТЕ ПОД СВОИ НУЖДЫ)
------------------------------------------------------------ */
const CONFIG = {
  // Путь к аудиофайлу
  audioPath: './assets/track.mp3',
  
  // Название трека
  trackTitle: 'Название трека',
  
  // Имя исполнителя
  trackArtist: 'Исполнитель',
  
  // Настройки дождя
  rain: {
    // Количество капель
    dropCount: 100,
    // Минимальная длительность падения (секунды)
    minDuration: 1.2,
    // Максимальная длительность падения (секунды)
    maxDuration: 2.5,
    // Минимальная задержка анимации (секунды)
    minDelay: 0,
    // Максимальная задержка анимации (секунды)
    maxDelay: 3,
    // Минимальная высота капли (px)
    minHeight: 15,
    // Максимальная высота капли (px)
    maxHeight: 35,
    // Минимальная прозрачность
    minOpacity: 0.4,
    // Максимальная прозрачность
    maxOpacity: 0.8
  },
  
  // Элементы DOM
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
    trackArtist: 'trackArtist',
    rainContainer: 'rainContainer',
    volumeSlider: 'volumeSlider'
  }
};

/* ------------------------------------------------------------
   АНИМАЦИЯ ЗАГОЛОВКА ВКЛАДКИ (печатание и удаление)
------------------------------------------------------------ */
const tabTitle = '@it6was9';
let titleIndex = 0;
let isDeleting = false;

function animateTabTitle() {
  const currentTitle = tabTitle.substring(0, titleIndex);
  document.title = currentTitle;
  
  if (!isDeleting) {
    // Печатаем
    titleIndex++;
    if (titleIndex === tabTitle.length) {
      isDeleting = true;
      setTimeout(animateTabTitle, 2000); // Пауза перед удалением
      return;
    }
  } else {
    // Удаляем
    titleIndex--;
    if (titleIndex === 0) {
      isDeleting = false;
      setTimeout(animateTabTitle, 500); // Пауза перед печатанием
      return;
    }
  }
  
  setTimeout(animateTabTitle, isDeleting ? 100 : 150);
}

/* ------------------------------------------------------------
   ФУНКЦИЯ СОЗДАНИЯ ДОЖДЯ
------------------------------------------------------------ */
function createRain() {
  const rainContainer = document.getElementById(CONFIG.elements.rainContainer);
  if (!rainContainer) return;
  
  const rainConfig = CONFIG.rain;
  const fragment = document.createDocumentFragment();
  
  for (let i = 0; i < rainConfig.dropCount; i++) {
    const drop = document.createElement('div');
    drop.classList.add('rain-drop');
    
    // Случайная позиция по горизонтали
    const randomX = Math.random() * 100;
    drop.style.left = `${randomX}%`;
    
    // Случайная высота капли
    const randomHeight = rainConfig.minHeight + Math.random() * (rainConfig.maxHeight - rainConfig.minHeight);
    drop.style.height = `${randomHeight}px`;
    
    // Случайная длительность анимации
    const randomDuration = rainConfig.minDuration + Math.random() * (rainConfig.maxDuration - rainConfig.minDuration);
    drop.style.animationDuration = `${randomDuration}s`;
    
    // Случайная задержка анимации
    const randomDelay = rainConfig.minDelay + Math.random() * (rainConfig.maxDelay - rainConfig.minDelay);
    drop.style.animationDelay = `${randomDelay}s`;
    
    // Случайная прозрачность
    const randomOpacity = rainConfig.minOpacity + Math.random() * (rainConfig.maxOpacity - rainConfig.minOpacity);
    drop.style.opacity = randomOpacity;
    
    fragment.appendChild(drop);
  }
  
  rainContainer.appendChild(fragment);
  console.log(`Дождь создан: ${rainConfig.dropCount} капель`);
}

/* ------------------------------------------------------------
   ИНИЦИАЛИЗАЦИЯ
------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  // Запускаем анимацию заголовка вкладки
  animateTabTitle();
  
  // Создаём дождь
  createRain();
  
  // Создаём аудио-объект
  const audio = new Audio(CONFIG.audioPath);
  audio.preload = 'metadata';
  audio.volume = 0.3; // Устанавливаем громкость 30%
  
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
  const volumeSlider = document.getElementById(CONFIG.elements.volumeSlider);
  
  // Устанавливаем текст трека и исполнителя
  trackTitleEl.textContent = CONFIG.trackTitle;
  trackArtistEl.textContent = CONFIG.trackArtist;
  
  // Устанавливаем начальную громкость
  volumeSlider.value = 30;
  
  // Переменные состояния
  let isPlaying = false;
  let animationFrameId = null;
  let isDragging = false;
  
  /* ------------------------------------------------------------
     ФОРМАТИРОВАНИЕ ВРЕМЕНИ
  ------------------------------------------------------------ */
  function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }
  
  /* ------------------------------------------------------------
     ОБНОВЛЕНИЕ ПРОГРЕСС-БАРА
  ------------------------------------------------------------ */
  function updateProgress() {
    if (audio.duration && !isDragging) {
      const progress = audio.currentTime / audio.duration;
      progressBar.style.transform = `scaleX(${progress})`;
      
      const containerWidth = progressContainer.offsetWidth;
      const thumbX = progress * containerWidth;
      progressThumb.style.transform = `translate(-50%, -50%) translateX(${thumbX}px)`;
      
      currentTimeEl.textContent = formatTime(audio.currentTime);
      totalTimeEl.textContent = formatTime(audio.duration);
    }
    
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
      audio.pause();
      setPlayingState(false);
      stopAnimationLoop();
    } else {
      audio.play().then(() => {
        setPlayingState(true);
        startAnimationLoop();
      }).catch(err => {
        console.error('Ошибка воспроизведения:', err);
      });
    }
  });
  
  /* ------------------------------------------------------------
     ОБРАБОТЧИК ГРОМКОСТИ
  ------------------------------------------------------------ */
  volumeSlider.addEventListener('input', (e) => {
    const volume = e.target.value / 100;
    audio.volume = volume;
    console.log('Громкость:', Math.round(volume * 100) + '%');
  });
  
  /* ------------------------------------------------------------
     ОБРАБОТЧИКИ СОБЫТИЙ АУДИО
  ------------------------------------------------------------ */
  audio.addEventListener('loadedmetadata', () => {
    totalTimeEl.textContent = formatTime(audio.duration);
    if (audio.duration) {
      progressBar.style.transform = `scaleX(0)`;
      currentTimeEl.textContent = '0:00';
    }
  });
  
  audio.addEventListener('ended', () => {
    setPlayingState(false);
    stopAnimationLoop();
    progressBar.style.transform = `scaleX(0)`;
    currentTimeEl.textContent = '0:00';
    audio.currentTime = 0;
  });
  
  audio.addEventListener('error', (e) => {
    console.error('Ошибка загрузки аудиофайла:', CONFIG.audioPath);
    setPlayingState(false);
    stopAnimationLoop();
  });
  
  /* ------------------------------------------------------------
     ПЕРЕТАСКИВАНИЕ ПОЛЗУНКА ПРОГРЕССА
  ------------------------------------------------------------ */
  progressContainer.addEventListener('pointerdown', (e) => {
    isDragging = true;
    progressContainer.setPointerCapture(e.pointerId);
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
  
  function updateProgressFromPointer(e) {
    const rect = progressContainer.getBoundingClientRect();
    let x = (e.clientX - rect.left) / rect.width;
    x = Math.max(0, Math.min(1, x));
    
    if (audio.duration) {
      audio.currentTime = x * audio.duration;
      progressBar.style.transform = `scaleX(${x})`;
      const thumbX = x * rect.width;
      progressThumb.style.transform = `translate(-50%, -50%) translateX(${thumbX}px)`;
      currentTimeEl.textContent = formatTime(audio.currentTime);
    }
  }
  
  /* ------------------------------------------------------------
     ИНИЦИАЛИЗАЦИЯ
  ------------------------------------------------------------ */
  setPlayingState(false);
  audio.load();
  
  // Пытаемся автоматически запустить воспроизведение
  audio.play().then(() => {
    setPlayingState(true);
    startAnimationLoop();
    console.log('Автовоспроизведение запущено');
  }).catch(err => {
    console.log('Автовоспроизведение заблокировано браузером. Нажмите play.');
    setPlayingState(false);
    
    // Автозапуск после первого взаимодействия с страницей
    document.addEventListener('click', () => {
      if (!isPlaying) {
        audio.play().then(() => {
          setPlayingState(true);
          startAnimationLoop();
        }).catch(error => {
          console.log('Ошибка воспроизведения:', error);
        });
      }
    }, { once: true });
  });
  
  console.log('Аудио инициализировано:', CONFIG.audioPath);
});
