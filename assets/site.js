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
      bar.style.height = isReducedMotion ? '10px' : '7px';
      audioWaveform.appendChild(bar);
      waveBars.push(bar);
    }

    if (waveIntervalId) {
      clearInterval(waveIntervalId);
    }

    const intervalMs = isReducedMotion ? 120 : 60;

    waveIntervalId = setInterval(() => {
      const now = Date.now();
      if (currentWavePhase === 'speaking') {
        waveBars.forEach((bar, idx) => {
          const norm = idx / (WAVE_BAR_COUNT - 1);
          const baseEnvelope = 0.38 + 0.62 * Math.sin(norm * Math.PI);
          const h1 = Math.sin(now * 0.012 + idx * 0.44);
          const h2 = Math.cos(now * 0.018 - idx * 0.32);
          const h3 = Math.sin(now * 0.007 + idx * 0.7);
          const factor = (h1 * 0.45 + h2 * 0.35 + h3 * 0.2 + 1) / 2;
          const maxPeak = isReducedMotion ? 18 : 34;
          const minPeak = isReducedMotion ? 8 : 12;
          const height = Math.max(minPeak, Math.min(maxPeak, Math.round(minPeak + baseEnvelope * (maxPeak - minPeak) * factor + (isReducedMotion ? 0 : Math.random() * 4))));
          bar.style.height = `${height}px`;
        });
        if (audioEnergyTag && Math.random() < 0.32) {
          const speechDb = ['-18 dBFS', '-20 dBFS', '-22 dBFS', '-24 dBFS', '-26 dBFS'];
          audioEnergyTag.textContent = speechDb[Math.floor(Math.random() * speechDb.length)];
        }
      } else {
        const t = now / 260;
        waveBars.forEach((bar, idx) => {
          const jitter = Math.sin(t + idx * 0.42) * 2.2 + Math.cos(t * 0.7 - idx * 0.28) * 1.4;
          const base = 8;
          const height = isReducedMotion
            ? Math.max(6, Math.min(10, Math.round(base + Math.sin(t + idx * 0.3) * 1.5)))
            : Math.max(5, Math.min(13, Math.round(base + jitter)));
          bar.style.height = `${height}px`;
        });
        if (audioEnergyTag && Math.random() < 0.15) {
          const idleDb = ['-48 dBFS', '-50 dBFS', '-52 dBFS', '-54 dBFS'];
          audioEnergyTag.textContent = idleDb[Math.floor(Math.random() * idleDb.length)];
        }
      }
    }, intervalMs);
  }

  // ── Two-utterance timeline constants ──────────────────────────────────────
  // Utterance A: Pass-1 outputs homophone errors → Pass-2 corrects
  const UTT_A_CHARS = [
    '今',
    '今天',
    '今天天',
    '今天天汽',
    '今天天汽怎',
    '今天天汽怎么',
    '今天天汽怎么杨'
  ];
  const UTT_A_LATENCIES = ['208ms', '212ms', '218ms', '224ms', '229ms', '236ms', '243ms'];
  const UTT_A_TIMESTAMPS = [
    '14:32:01.320', '14:32:01.740', '14:32:02.160',
    '14:32:02.580', '14:32:03.000', '14:32:03.420', '14:32:03.840'
  ];
  const UTT_A_PASS1_WRONG   = '今天天汽怎么杨';   // imperfect provisional
  const UTT_A_PASS2_CORRECT = '今天天气怎么样？';  // Pass-2 corrected final
  const UTT_A_CORRECTION_NOTE = 'Pass-2 修正：天汽→天气，杨→样 + 标点';

  // Utterance B: Pass-1 outputs 会意室 → Pass-2 corrects to 会议室
  const UTT_B_CHARS = [
    '请',
    '请打',
    '请打开',
    '请打开会',
    '请打开会意',
    '请打开会意室',
    '请打开会意室的',
    '请打开会意室的空调'
  ];
  const UTT_B_LATENCIES = ['211ms', '218ms', '222ms', '228ms', '231ms', '238ms', '244ms', '249ms'];
  const UTT_B_TIMESTAMPS = [
    '14:32:14.320', '14:32:14.660', '14:32:15.000',
    '14:32:15.340', '14:32:15.680', '14:32:16.020',
    '14:32:16.360', '14:32:16.700'
  ];
  const UTT_B_PASS1_WRONG   = '请打开会意室的空调';   // imperfect provisional
  const UTT_B_PASS2_CORRECT = '请打开会议室的空调。';  // Pass-2 corrected final
  const UTT_B_CORRECTION_NOTE = 'Pass-2 修正：会意室→会议室 + 句号';

  // Total loop: ~25 000 ms normal; ht() applies ×1.4 for reduced-motion (~35 000 ms)
  const HERO_LOOP_DURATION = 25000;

  let heroTimeouts = [];

  function clearHeroTimeouts() {
    heroTimeouts.forEach(clearTimeout);
    heroTimeouts = [];
  }

  function ht(fn, delay) {
    // Helper: schedule and track a hero-demo timeout
    heroTimeouts.push(setTimeout(fn, isReducedMotion ? Math.round(delay * 1.4) : delay));
  }

  function resetHeroPanel() {
    if (demoResultPanel) demoResultPanel.className = 'demo-result-panel state-idle';
    if (demoResultBadge) {
      demoResultBadge.className = 'event-badge badge-standby';
      demoResultBadge.textContent = 'standby';
    }
    if (demoResultLatency) demoResultLatency.textContent = '待命中';
    if (demoResultNote) demoResultNote.textContent = '等待语音推流...';
    if (demoResultTime) demoResultTime.textContent = '14:32:01.000';
    if (demoResultText) {
      demoResultText.className = 'stream-event-text text-partial';
      demoResultText.classList.remove('text-refresh-flash');
    }
    if (demoTextContent) demoTextContent.textContent = '';
    if (demoTypingCursor) demoTypingCursor.classList.remove('is-hidden');
  }

  function resetHeroDemo() {
    clearHeroTimeouts();
    currentWavePhase = 'idle';
    if (audioEnergyTag) audioEnergyTag.textContent = '-52 dBFS';
    if (telemetryPass1) telemetryPass1.textContent = '200~600ms';
    if (telemetryPass1Pill) telemetryPass1Pill.classList.remove('is-active', 'is-busy');
    if (telemetryVad) telemetryVad.textContent = 'Standby';
    if (telemetryVadPill) telemetryVadPill.classList.remove('is-active', 'is-busy');
    if (telemetryPass2) telemetryPass2.textContent = 'Idle';
    if (telemetryPass2Pill) telemetryPass2Pill.classList.remove('is-active', 'is-busy');
    resetHeroPanel();
  }

  // ── Utterance helper ───────────────────────────────────────────────────────
  // offset: base time offset (ms) for this utterance within the loop
  // chars / latencies / timestamps: Pass-1 streaming steps
  // wrongText: provisional (imperfect) text
  // correctText: Pass-2 corrected final
  // correctionNote: human-readable correction label
  // vadStartTime / vadEndTime / pass2Time / finalTime: panel timestamps
  function scheduleUtterance({
    offset,
    chars, latencies, timestamps,
    wrongText, correctText, correctionNote,
    vadStartTime, vadEndTime, pass2Time, finalTime
  }) {
    // A) Speech begins; Pass-1 active
    ht(() => {
      currentWavePhase = 'speaking';
      if (audioEnergyTag) audioEnergyTag.textContent = '-21 dBFS';
      if (telemetryVad) telemetryVad.textContent = 'Speech';
      if (telemetryVadPill) { telemetryVadPill.classList.remove('is-busy'); telemetryVadPill.classList.add('is-active'); }
      if (telemetryPass1) telemetryPass1.textContent = latencies[0];
      if (telemetryPass1Pill) { telemetryPass1Pill.classList.remove('is-busy'); telemetryPass1Pill.classList.add('is-active'); }

      if (demoResultPanel) demoResultPanel.className = 'demo-result-panel state-partial';
      if (demoResultBadge) { demoResultBadge.className = 'event-badge badge-partial'; demoResultBadge.textContent = 'partial'; }
      if (demoResultLatency) demoResultLatency.textContent = latencies[0];
      if (demoResultNote) demoResultNote.textContent = 'ONNX Paraformer-online 流式推理中';
      if (demoResultTime) demoResultTime.textContent = vadStartTime;
      if (demoResultText) demoResultText.className = 'stream-event-text text-partial';
      if (demoTypingCursor) demoTypingCursor.classList.remove('is-hidden');
    }, offset + 200);

    // B) Character-by-character typing (wrong Pass-1 text)
    chars.forEach((ch, i) => {
      ht(() => {
        if (demoTextContent) demoTextContent.textContent = ch;
        if (demoResultLatency) demoResultLatency.textContent = latencies[i];
        if (telemetryPass1) telemetryPass1.textContent = latencies[i];
        if (demoResultTime) demoResultTime.textContent = timestamps[i];
      }, offset + 600 + i * 380);
    });

    const typingEnd = offset + 600 + chars.length * 380; // ~= end of last char

    // C) VAD Endpoint + provisional (keeps the imperfect text visible)
    ht(() => {
      currentWavePhase = 'idle';
      if (audioEnergyTag) audioEnergyTag.textContent = '-47 dBFS (Silence)';
      if (telemetryVad) telemetryVad.textContent = 'Endpoint';
      if (telemetryVadPill) telemetryVadPill.classList.remove('is-active', 'is-busy');
      if (telemetryPass1Pill) telemetryPass1Pill.classList.remove('is-active', 'is-busy');

      if (demoResultPanel) demoResultPanel.className = 'demo-result-panel state-provisional';
      if (demoResultBadge) { demoResultBadge.className = 'event-badge badge-provisional'; demoResultBadge.textContent = 'provisional'; }
      if (demoResultLatency) demoResultLatency.textContent = 'VAD 360ms';
      if (demoResultNote) demoResultNote.textContent = 'FSMN-VAD 检出句尾 · 快速整句先行上屏（Pass-1 初稿）';
      if (demoResultText) demoResultText.className = 'stream-event-text text-provisional';
      if (demoTextContent) demoTextContent.textContent = wrongText;  // ← still the WRONG text
      if (demoResultTime) demoResultTime.textContent = vadEndTime;
    }, typingEnd + 300);

    // D) Pass-2 busy
    ht(() => {
      if (telemetryVad) telemetryVad.textContent = 'Silence';
      if (telemetryPass2) telemetryPass2.textContent = 'vLLM 推理中...';
      if (telemetryPass2Pill) { telemetryPass2Pill.classList.remove('is-active'); telemetryPass2Pill.classList.add('is-busy'); }

      if (demoResultPanel) demoResultPanel.className = 'demo-result-panel state-pass2';
      if (demoResultBadge) { demoResultBadge.className = 'event-badge badge-pass2'; demoResultBadge.textContent = 'pass-2'; }
      if (demoResultLatency) demoResultLatency.textContent = 'vLLM 推理中...';
      if (demoResultNote) demoResultNote.textContent = '提交 FinalQueue · Qwen3-ASR 异步定稿中...';
      if (demoResultText) demoResultText.className = 'stream-event-text text-pass2';
      if (demoResultTime) demoResultTime.textContent = pass2Time;
    }, typingEnd + 1100);

    // E) Pass-2 final: in-place correction flash + correct text
    ht(() => {
      if (demoTextContent) demoTextContent.textContent = correctText; // ← CORRECTED text

      if (demoResultText) {
        demoResultText.className = 'stream-event-text text-final';
        if (!isReducedMotion) {
          demoResultText.classList.remove('text-refresh-flash');
          void demoResultText.offsetWidth; // Force reflow
          demoResultText.classList.add('text-refresh-flash');
        }
      }
      if (demoTypingCursor) demoTypingCursor.classList.add('is-hidden');
      if (demoResultPanel) demoResultPanel.className = 'demo-result-panel state-final';
      if (demoResultBadge) { demoResultBadge.className = 'event-badge badge-final'; demoResultBadge.textContent = 'final'; }
      if (demoResultLatency) demoResultLatency.textContent = 'vLLM 520ms · 守卫校验通过';
      if (demoResultNote) demoResultNote.textContent = correctionNote;  // ← shows correction mapping
      if (demoResultTime) demoResultTime.textContent = finalTime;

      if (telemetryPass2) telemetryPass2.textContent = '520ms';
      if (telemetryPass2Pill) { telemetryPass2Pill.classList.remove('is-busy'); telemetryPass2Pill.classList.add('is-active'); }
    }, typingEnd + 2400);

    // F) Settle Pass-2 pill back to Idle (1 s after final)
    ht(() => {
      if (telemetryPass2Pill) telemetryPass2Pill.classList.remove('is-active');
      if (telemetryPass2) telemetryPass2.textContent = 'Idle';
      if (demoResultNote) demoResultNote.textContent = '定稿已输出 · 保持会话监听';
    }, typingEnd + 3500);
  }

  function startHeroDemoLoop() {
    resetHeroDemo();

    // ── Utterance A ── t ≈ 0 → ~10 000 ms ───────────────────────────────
    scheduleUtterance({
      offset: 800,
      chars: UTT_A_CHARS,
      latencies: UTT_A_LATENCIES,
      timestamps: UTT_A_TIMESTAMPS,
      wrongText: UTT_A_PASS1_WRONG,
      correctText: UTT_A_PASS2_CORRECT,
      correctionNote: UTT_A_CORRECTION_NOTE,
      vadStartTime: '14:32:01.080',
      vadEndTime:   '14:32:04.200',
      pass2Time:    '14:32:04.620',
      finalTime:    '14:32:05.180'
    });

    // ── Inter-utterance gap: VAD Standby, wave idle, panel soft-reset ──
    // A typing ends at: 800 + 600 + 7*380 = 4060; final at 4060+2400 = 6460; settle at 7560
    // Gap starts at ~8 200 ms
    const GAP_START = 8200;
    ht(() => {
      if (telemetryVad) telemetryVad.textContent = 'Standby';
      if (telemetryVadPill) telemetryVadPill.classList.remove('is-active', 'is-busy');
      if (audioEnergyTag) audioEnergyTag.textContent = '-52 dBFS';
      // Soft-clear result panel for next utterance
      resetHeroPanel();
      if (demoResultNote) demoResultNote.textContent = '会话保持中，等待下一段语音...';
    }, GAP_START);

    // ── Utterance B ── t ≈ 11 500 ms → ~21 000 ms ────────────────────────
    const UTT_B_OFFSET = 11500;
    scheduleUtterance({
      offset: UTT_B_OFFSET,
      chars: UTT_B_CHARS,
      latencies: UTT_B_LATENCIES,
      timestamps: UTT_B_TIMESTAMPS,
      wrongText: UTT_B_PASS1_WRONG,
      correctText: UTT_B_PASS2_CORRECT,
      correctionNote: UTT_B_CORRECTION_NOTE,
      vadStartTime: '14:32:14.080',
      vadEndTime:   '14:32:17.200',
      pass2Time:    '14:32:17.620',
      finalTime:    '14:32:18.200'
    });

    // B typing ends at: 11500 + 600 + 8*380 = 15140; final at 15140+2400=17540; settle at 18640

    // ── Brief end-of-loop pause, then restart ─────────────────────────────
    ht(() => {
      startHeroDemoLoop();
    }, HERO_LOOP_DURATION);
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
  function boot() {
    try {
      initWaveform();
      startHeroDemoLoop();
    } catch (e) {
      console.warn('Hero demo init failed', e);
    }
    try {
      initScrollReveal();
      initCopyButtons();
      initSvgNodeInteractions();
      highlightArchStep(0);
      startArchStepLoop();
      initSmoothScrollAndSpy();
    } catch (e) {
      console.warn('Site chrome init failed', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
