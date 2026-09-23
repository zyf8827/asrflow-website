/**
 * ASRFlow Official Website Client Interaction Script
 * Features:
 * 1. Live Hero Demo (Streaming Waveform + 2-Pass Transcript Simulation + Loop)
 * 2. Animated Architecture Controller (Step Sequencing + Node Interaction + Static Toggle)
 * 3. Scroll-Reveal Observer (prefers-reduced-motion aware)
 * 4. Clipboard Copy Utility
 * 5. Smooth Page Navigation Scroll & Scrollspy
 */

(function () {
  'use strict';

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================================
     1. Live Hero Console & Streaming Demo (逐字吐字 + Pass-2 异步回刷)
     ========================================================================= */
  const audioWaveform = document.getElementById('audioWaveform');
  const audioEnergyTag = document.getElementById('audioEnergyTag');
  const telemetryPass1Pill = document.getElementById('telemetryPass1Pill');
  const telemetryPass1 = document.getElementById('telemetryPass1');
  const telemetryVadPill = document.getElementById('telemetryVadPill');
  const telemetryVad = document.getElementById('telemetryVad');
  const telemetryPass2Pill = document.getElementById('telemetryPass2Pill');
  const telemetryPass2 = document.getElementById('telemetryPass2');
  const demoResultPanel = document.getElementById('demoResultPanel');
  const demoResultTime = document.getElementById('demoResultTime');
  const demoResultBadge = document.getElementById('demoResultBadge');
  const demoResultLatency = document.getElementById('demoResultLatency');
  const demoResultNote = document.getElementById('demoResultNote');
  const demoResultText = document.getElementById('demoResultText');
  const demoTextContent = document.getElementById('demoTextContent');
  const demoTypingCursor = document.getElementById('demoTypingCursor');
  const demoReplayBtn = document.getElementById('demoReplayBtn');

  const WAVE_BAR_COUNT = 36;
  let waveBars = [];
  let currentWavePhase = 'idle'; // 'idle' | 'speaking'
  let waveIntervalId = null;

  function initWaveform() {
    if (!audioWaveform) return;
    audioWaveform.innerHTML = '';
    waveBars = [];
    for (let i = 0; i < WAVE_BAR_COUNT; i++) {
      const bar = document.createElement('span');
      bar.className = 'wave-bar';
      bar.style.height = isReducedMotion ? '12px' : '4px';
      audioWaveform.appendChild(bar);
      waveBars.push(bar);
    }

    if (isReducedMotion) {
      if (audioEnergyTag) audioEnergyTag.textContent = '-52 dBFS';
      return;
    }

    if (waveIntervalId) {
      clearInterval(waveIntervalId);
    }

    waveIntervalId = setInterval(() => {
      const now = Date.now();
      if (currentWavePhase === 'speaking') {
        waveBars.forEach((bar, idx) => {
          const norm = idx / (WAVE_BAR_COUNT - 1);
          const envelope = Math.sin(norm * Math.PI);
          const h1 = Math.sin(now * 0.013 + idx * 0.48);
          const h2 = Math.cos(now * 0.021 - idx * 0.32);
          const factor = (h1 + h2 + 2) / 4;
          const height = Math.max(4, Math.min(26, Math.round(5 + envelope * 18 * factor + Math.random() * 3)));
          bar.style.height = `${height}px`;
        });
        if (audioEnergyTag && Math.random() < 0.28) {
          const speechDb = ['-20 dBFS', '-22 dBFS', '-19 dBFS', '-24 dBFS', '-21 dBFS'];
          audioEnergyTag.textContent = speechDb[Math.floor(Math.random() * speechDb.length)];
        }
      } else {
        const t = now / 320;
        waveBars.forEach((bar, idx) => {
          const jitter = Math.sin(t + idx * 0.32) * 1.3;
          const height = Math.max(3, Math.min(7, Math.round(4 + jitter)));
          bar.style.height = `${height}px`;
        });
        if (audioEnergyTag && Math.random() < 0.12) {
          const idleDb = ['-51 dBFS', '-52 dBFS', '-53 dBFS'];
          audioEnergyTag.textContent = idleDb[Math.floor(Math.random() * idleDb.length)];
        }
      }
    }, 60);
  }

  const SPEECH_CHARS = ['今', '今天', '今天天', '今天天气', '今天天气怎', '今天天气怎么', '今天天气怎么样'];
  const TYPING_LATENCIES = ['205ms', '215ms', '220ms', '230ms', '225ms', '235ms', '245ms'];
  const TYPING_TIMESTAMPS = [
    '14:32:01.320',
    '14:32:01.550',
    '14:32:01.780',
    '14:32:02.010',
    '14:32:02.240',
    '14:32:02.470',
    '14:32:02.700'
  ];

  const HERO_LOOP_DURATION = 11500;
  let heroTimeouts = [];

  function clearHeroTimeouts() {
    heroTimeouts.forEach(clearTimeout);
    heroTimeouts = [];
  }

  function resetHeroDemo() {
    clearHeroTimeouts();
    currentWavePhase = 'idle';

    if (audioEnergyTag) audioEnergyTag.textContent = '-52 dBFS';

    if (telemetryPass1) telemetryPass1.textContent = '200~600ms';
    if (telemetryPass1Pill) {
      telemetryPass1Pill.classList.remove('is-active', 'is-busy');
    }

    if (telemetryVad) telemetryVad.textContent = 'Standby';
    if (telemetryVadPill) {
      telemetryVadPill.classList.remove('is-active', 'is-busy');
    }

    if (telemetryPass2) telemetryPass2.textContent = 'Idle';
    if (telemetryPass2Pill) {
      telemetryPass2Pill.classList.remove('is-active', 'is-busy');
    }

    if (demoResultPanel) {
      demoResultPanel.className = 'demo-result-panel state-idle';
    }
    if (demoResultBadge) {
      demoResultBadge.className = 'event-badge badge-standby';
      demoResultBadge.textContent = 'standby';
    }
    if (demoResultLatency) {
      demoResultLatency.textContent = '待命中';
    }
    if (demoResultNote) {
      demoResultNote.textContent = '等待语音推流...';
    }
    if (demoResultTime) {
      demoResultTime.textContent = '14:32:01.000';
    }
    if (demoResultText) {
      demoResultText.className = 'stream-event-text text-partial';
      demoResultText.classList.remove('text-refresh-flash');
    }
    if (demoTextContent) {
      demoTextContent.textContent = '';
    }
    if (demoTypingCursor) {
      demoTypingCursor.classList.remove('is-hidden');
    }
  }

  function startHeroDemoLoop() {
    resetHeroDemo();

    if (isReducedMotion) {
      if (demoTextContent) demoTextContent.textContent = '“今天天气怎么样？”';
      if (demoTypingCursor) demoTypingCursor.classList.add('is-hidden');
      if (demoResultPanel) demoResultPanel.className = 'demo-result-panel state-final';
      if (demoResultBadge) {
        demoResultBadge.className = 'event-badge badge-final';
        demoResultBadge.textContent = 'final';
      }
      if (demoResultLatency) demoResultLatency.textContent = 'vLLM 540ms · 守卫校验通过';
      if (demoResultNote) demoResultNote.textContent = 'Qwen3-ASR 异步定稿 · 标点修正完成';
      if (demoResultTime) demoResultTime.textContent = '14:32:03.960';
      if (demoResultText) demoResultText.className = 'stream-event-text text-final';
      if (telemetryPass1) telemetryPass1.textContent = '200~600ms';
      if (telemetryVad) telemetryVad.textContent = 'Connected';
      if (telemetryPass2) telemetryPass2.textContent = '540ms';
      if (audioEnergyTag) audioEnergyTag.textContent = '-52 dBFS';
      return;
    }

    // Step 1: Speech begins & Pass-1 initialization (t = 800ms)
    heroTimeouts.push(setTimeout(() => {
      currentWavePhase = 'speaking';
      if (audioEnergyTag) audioEnergyTag.textContent = '-22 dBFS';
      if (telemetryVad) telemetryVad.textContent = 'Speech';
      if (telemetryVadPill) telemetryVadPill.classList.add('is-active');
      if (telemetryPass1) telemetryPass1.textContent = '210ms';
      if (telemetryPass1Pill) telemetryPass1Pill.classList.add('is-active');

      if (demoResultPanel) demoResultPanel.className = 'demo-result-panel state-partial';
      if (demoResultBadge) {
        demoResultBadge.className = 'event-badge badge-partial';
        demoResultBadge.textContent = 'partial';
      }
      if (demoResultLatency) demoResultLatency.textContent = '210ms';
      if (demoResultNote) demoResultNote.textContent = 'ONNX Paraformer-online 流式推理中';
      if (demoResultTime) demoResultTime.textContent = '14:32:01.120';
      if (demoTypingCursor) demoTypingCursor.classList.remove('is-hidden');
    }, 800));

    // Step 2: Incremental character-by-character typing (t = 1100ms ~ 2780ms)
    SPEECH_CHARS.forEach((chars, i) => {
      heroTimeouts.push(setTimeout(() => {
        if (demoTextContent) demoTextContent.textContent = chars;
        if (demoResultLatency) demoResultLatency.textContent = TYPING_LATENCIES[i];
        if (telemetryPass1) telemetryPass1.textContent = TYPING_LATENCIES[i];
        if (demoResultTime) demoResultTime.textContent = TYPING_TIMESTAMPS[i];
      }, 1100 + i * 280));
    });

    // Step 3: FSMN-VAD Endpoint Cutoff & Provisional Sentence (t = 3500ms)
    heroTimeouts.push(setTimeout(() => {
      currentWavePhase = 'idle';
      if (audioEnergyTag) audioEnergyTag.textContent = '-45 dBFS (Silence)';
      if (telemetryVad) telemetryVad.textContent = 'Endpoint';
      if (telemetryVadPill) telemetryVadPill.classList.remove('is-active');
      if (telemetryPass1Pill) telemetryPass1Pill.classList.remove('is-active');

      if (demoResultPanel) demoResultPanel.className = 'demo-result-panel state-provisional';
      if (demoResultBadge) {
        demoResultBadge.className = 'event-badge badge-provisional';
        demoResultBadge.textContent = 'provisional';
      }
      if (demoResultLatency) demoResultLatency.textContent = 'VAD 380ms';
      if (demoResultNote) demoResultNote.textContent = 'FSMN-VAD 检出句尾停顿 · 快速整句先行上屏';
      if (demoResultText) demoResultText.className = 'stream-event-text text-provisional';
      if (demoResultTime) demoResultTime.textContent = '14:32:02.980';
    }, 3500));

    // Step 4: Dispatch to Pass-2 FinalQueue & vLLM Busy (t = 4400ms)
    heroTimeouts.push(setTimeout(() => {
      if (telemetryVad) telemetryVad.textContent = 'Silence';
      if (telemetryPass2) telemetryPass2.textContent = 'vLLM 480ms...';
      if (telemetryPass2Pill) telemetryPass2Pill.classList.add('is-busy');

      if (demoResultPanel) demoResultPanel.className = 'demo-result-panel state-pass2';
      if (demoResultBadge) {
        demoResultBadge.className = 'event-badge badge-pass2';
        demoResultBadge.textContent = 'pass-2';
      }
      if (demoResultLatency) demoResultLatency.textContent = 'vLLM 推理中...';
      if (demoResultNote) demoResultNote.textContent = '提交 FinalQueue · Qwen3-ASR 异步定稿中...';
      if (demoResultText) demoResultText.className = 'stream-event-text text-pass2';
      if (demoResultTime) demoResultTime.textContent = '14:32:03.420';
    }, 4400));

    // Step 5: Pass-2 In-place 回刷 + Refresh Flash (t = 5400ms)
    heroTimeouts.push(setTimeout(() => {
      // In-place replacement
      if (demoTextContent) demoTextContent.textContent = '“今天天气怎么样？”';

      // Trigger refresh flash animation
      if (demoResultText) {
        demoResultText.className = 'stream-event-text text-final';
        demoResultText.classList.remove('text-refresh-flash');
        void demoResultText.offsetWidth; // Force DOM reflow
        demoResultText.classList.add('text-refresh-flash');
      }

      // Hide typing cursor in final state
      if (demoTypingCursor) demoTypingCursor.classList.add('is-hidden');

      if (demoResultPanel) demoResultPanel.className = 'demo-result-panel state-final';
      if (demoResultBadge) {
        demoResultBadge.className = 'event-badge badge-final';
        demoResultBadge.textContent = 'final';
      }
      if (demoResultLatency) demoResultLatency.textContent = 'vLLM 540ms · 守卫校验通过';
      if (demoResultNote) demoResultNote.textContent = 'Qwen3-ASR 异步定稿完成 · 标点修正完成';
      if (demoResultTime) demoResultTime.textContent = '14:32:03.960';

      if (telemetryPass2) telemetryPass2.textContent = '540ms';
      if (telemetryPass2Pill) {
        telemetryPass2Pill.classList.remove('is-busy');
        telemetryPass2Pill.classList.add('is-active');
      }
    }, 5400));

    // Step 6: Telemetry settling (t = 6800ms)
    heroTimeouts.push(setTimeout(() => {
      if (telemetryPass2Pill) telemetryPass2Pill.classList.remove('is-active');
    }, 6800));

    // Step 7: Auto-loop cycle
    heroTimeouts.push(setTimeout(() => {
      startHeroDemoLoop();
    }, HERO_LOOP_DURATION));
  }

  // Replay Button Listener
  if (demoReplayBtn) {
    demoReplayBtn.addEventListener('click', () => {
      demoReplayBtn.classList.add('btn-clicked');
      setTimeout(() => demoReplayBtn.classList.remove('btn-clicked'), 300);
      startHeroDemoLoop();
    });
  }

  /* =========================================================================
     2. Interactive Architecture Diagram Controller
     ========================================================================= */
  const archPlayPauseBtn = document.getElementById('archPlayPauseBtn');
  const archStepIndicator = document.getElementById('archStepIndicator');
  const archInspector = document.getElementById('archInspector');

  const ARCH_STEPS = [
    {
      id: 'step-1',
      title: '第 1 阶段：客户端推流与网关分帧',
      nodes: ['node-client', 'node-gateway', 'node-buffer'],
      desc: '客户端通过单个 WebSocket 长连接持续推送 16kHz PCM 单通道音频帧。网关解耦处理控制信令与二进制流，音频写入低延迟环形缓冲区。'
    },
    {
      id: 'step-2',
      title: '第 2 阶段：首遍低延迟增量吐字 (Pass-1)',
      nodes: ['node-pass1'],
      desc: 'ONNX Runtime Paraformer-online 多路动态合批推理，快速产出 200~600ms 低延迟 partial 增量事件，即时推回客户端上屏。'
    },
    {
      id: 'step-3',
      title: '第 3 阶段：FSMN-VAD 切句与快速整句 (Provisional)',
      nodes: ['node-vad', 'node-finalqueue'],
      desc: 'FSMN-VAD 实时判定语音起止点。切句时产生 provisional 快速整句送往客户端，同时将完整句子音频切片压入 FinalQueue 微批聚合队列。'
    },
    {
      id: 'step-4',
      title: '第 4 阶段：Pass-2 Qwen3-ASR vLLM 异步二遍',
      nodes: ['node-pass2'],
      desc: '通过 HTTP 解耦调用独立部署的 Qwen3-ASR vLLM 服务，进行全局语义修正与大模型标点预测，产出高准确率候选文本。'
    },
    {
      id: 'step-5',
      title: '第 5 阶段：Consistency Guard 一致性守卫与定稿交付',
      nodes: ['node-guard', 'node-delivery'],
      desc: 'Consistency Guard 进行首二遍一致性校验与 L2 看门狗检查，拦截幻觉与重复字；经 ITN 正则化后向客户端推送最终 final 定稿。'
    }
  ];

  let currentArchStepIndex = 0;
  let archStepInterval = null;
  let isArchFlowPlaying = true;

  function highlightArchStep(index) {
    const step = ARCH_STEPS[index];
    if (!step) return;

    // Update indicator pill
    if (archStepIndicator) {
      archStepIndicator.innerHTML = `<strong>${step.title.split('：')[0]}</strong>：${step.title.split('：')[1]}`;
    }

    // Update inspector info box
    if (archInspector) {
      archInspector.innerHTML = `
        <div class="inspector-card">
          <div class="inspector-header">
            <span class="inspector-dot"></span>
            <span class="inspector-title">${step.title}</span>
          </div>
          <p class="inspector-desc">${step.desc}</p>
        </div>
      `;
    }

    // Highlight active nodes inside SVG
    const svg = document.querySelector('.asrflow-arch-svg');
    if (svg) {
      svg.querySelectorAll('.node-group').forEach(node => {
        node.classList.remove('node-highlighted');
      });
      step.nodes.forEach(nodeId => {
        const el = svg.querySelector(`#${nodeId}`);
        if (el) el.classList.add('node-highlighted');
      });
    }
  }

  function startArchStepLoop() {
    if (isReducedMotion) {
      highlightArchStep(0);
      return;
    }
    if (archStepInterval) clearInterval(archStepInterval);
    archStepInterval = setInterval(() => {
      if (!isArchFlowPlaying) return;
      currentArchStepIndex = (currentArchStepIndex + 1) % ARCH_STEPS.length;
      highlightArchStep(currentArchStepIndex);
    }, 3200);
  }

  // Play / Pause Flow Button
  if (archPlayPauseBtn) {
    archPlayPauseBtn.addEventListener('click', () => {
      isArchFlowPlaying = !isArchFlowPlaying;
      if (isArchFlowPlaying) {
        archPlayPauseBtn.innerHTML = `
          <svg viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
          <span>暂停动效</span>
        `;
      } else {
        archPlayPauseBtn.innerHTML = `
          <svg viewBox="0 0 24 24"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          <span>继续播放</span>
        `;
      }
    });
  }

  // Node Click Handlers inside inline SVG
  function initSvgNodeInteractions() {
    const svg = document.querySelector('.asrflow-arch-svg');
    if (!svg) return;
    svg.querySelectorAll('.node-group').forEach(node => {
      node.style.cursor = 'pointer';
      node.addEventListener('click', () => {
        const nodeId = node.id;
        // Find corresponding step or node info
        const step = ARCH_STEPS.find(s => s.nodes.includes(nodeId));
        if (step) {
          currentArchStepIndex = ARCH_STEPS.indexOf(step);
          highlightArchStep(currentArchStepIndex);
        }
      });
    });
  }


  /* =========================================================================
     3. Scroll-Reveal Observer (IntersectionObserver)
     ========================================================================= */
  function initScrollReveal() {
    const elementsToReveal = document.querySelectorAll('.reveal-on-scroll');
    if (elementsToReveal.length === 0) return;

    if (isReducedMotion || !('IntersectionObserver' in window)) {
      elementsToReveal.forEach(el => el.classList.add('revealed'));
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    elementsToReveal.forEach(el => observer.observe(el));
  }


  /* =========================================================================
     4. Code Snippet Copy Handler
     ========================================================================= */
  function initCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(button => {
      button.addEventListener('click', async () => {
        const code = button.getAttribute('data-code');
        if (!code) return;
        try {
          await navigator.clipboard.writeText(code);
          const span = button.querySelector('span');
          const originalText = span ? span.textContent : '复制';
          button.classList.add('copied');
          if (span) span.textContent = '已复制';
          setTimeout(() => {
            button.classList.remove('copied');
            if (span) span.textContent = originalText;
          }, 2000);
        } catch (err) {
          console.warn('Clipboard write failed:', err);
        }
      });
    });
  }


  /* =========================================================================
     5. Smooth Page Navigation Scroll & Scrollspy (IntersectionObserver)
     ========================================================================= */
  function initSmoothScrollAndSpy() {
    const navLinks = document.querySelectorAll('.site-nav .nav-link');
    const samePageLinks = document.querySelectorAll('a[href^="#"]');

    // Smooth scroll for same-page anchors
    samePageLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href) return;

        if (href === '#' || href === '#top') {
          e.preventDefault();
          window.scrollTo({
            top: 0,
            behavior: isReducedMotion ? 'auto' : 'smooth'
          });
          if (history.pushState) {
            history.pushState(null, '', ' ');
          }
          navLinks.forEach(l => l.classList.remove('is-active'));
          return;
        }

        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: isReducedMotion ? 'auto' : 'smooth',
            block: 'start'
          });
          if (history.pushState) {
            history.pushState(null, '', href);
          }
          if (link.classList.contains('nav-link')) {
            navLinks.forEach(l => l.classList.remove('is-active'));
            link.classList.add('is-active');
          }
        }
      });
    });

    // Nav active link highlight via IntersectionObserver
    const sections = document.querySelectorAll('section[id]');
    if (sections.length > 0 && 'IntersectionObserver' in window) {
      const spyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.getAttribute('id');
            navLinks.forEach(link => {
              if (link.getAttribute('href') === `#${id}`) {
                link.classList.add('is-active');
              } else {
                link.classList.remove('is-active');
              }
            });
          }
        });
      }, {
        rootMargin: '-75px 0px -55% 0px',
        threshold: 0.05
      });

      sections.forEach(sec => spyObserver.observe(sec));

      // Clear active nav items when scrolled back to top
      window.addEventListener('scroll', () => {
        if (window.scrollY < 200) {
          navLinks.forEach(l => l.classList.remove('is-active'));
        }
      }, { passive: true });
    }
  }


  /* =========================================================================
     DOM Ready Bootstrapper
     ========================================================================= */
  document.addEventListener('DOMContentLoaded', () => {
    initWaveform();
    startHeroDemoLoop();
    initScrollReveal();
    initCopyButtons();
    initSvgNodeInteractions();
    highlightArchStep(0);
    startArchStepLoop();
    initSmoothScrollAndSpy();
  });

})();
