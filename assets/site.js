/**
 * ASRFlow Official Website Client Interaction Script
 * Features:
 * 1. Live Hero Demo (Streaming Waveform + 2-Pass Transcript Simulation + Loop)
 * 2. Animated Architecture Controller (Step Sequencing + Node Interaction + Static Toggle)
 * 3. Scroll-Reveal Observer (prefers-reduced-motion aware)
 * 4. Clipboard Copy Utility
 */

(function () {
  'use strict';

  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =========================================================================
     1. Live Hero Console & Streaming Demo
     ========================================================================= */
  const heroDemoContainer = document.getElementById('heroLiveDemo');
  const demoEventsContainer = document.getElementById('demoEventsContainer');
  const audioWaveform = document.getElementById('audioWaveform');
  const telemetryPass1 = document.getElementById('telemetryPass1');
  const telemetryVad = document.getElementById('telemetryVad');
  const telemetryPass2 = document.getElementById('telemetryPass2');
  const audioEnergyTag = document.getElementById('audioEnergyTag');
  const demoReplayBtn = document.getElementById('demoReplayBtn');
  const heroTabLive = document.getElementById('heroTabLive');
  const heroTabStatic = document.getElementById('heroTabStatic');
  const heroStaticPanel = document.getElementById('heroStaticPanel');

  // Scripted events for the 2-Pass live stream simulation
  const DEMO_TIMELINE = [
    {
      timeMs: 400,
      action: 'start_speech_1',
      energy: '-21 dBFS',
      vad: 'Speech',
      pass1: '210ms',
      pass2: 'idle'
    },
    {
      timeMs: 1000,
      type: 'partial',
      tag: 'partial',
      latency: '210ms',
      text: '您好，我',
      timeStr: '14:32:01.120',
      pass1: '210ms'
    },
    {
      timeMs: 1800,
      type: 'partial',
      tag: 'partial',
      latency: '240ms',
      text: '您好，我想查询',
      timeStr: '14:32:01.480',
      pass1: '240ms'
    },
    {
      timeMs: 2600,
      type: 'partial',
      tag: 'partial',
      latency: '265ms',
      text: '您好，我想查询订单',
      timeStr: '14:32:01.820',
      pass1: '265ms'
    },
    {
      timeMs: 3400,
      type: 'provisional',
      tag: 'provisional',
      latency: 'VAD 380ms',
      text: '您好我想查询订单',
      timeStr: '14:32:02.160',
      note: 'FSMN-VAD 检出句尾停顿 · 快速整句先行上屏',
      vad: 'Endpoint',
      energy: '-42 dBFS (Silence)'
    },
    {
      timeMs: 4400,
      action: 'pass2_dispatch',
      pass2: 'vLLM 480ms...',
      vad: 'Silence'
    },
    {
      timeMs: 5100,
      type: 'final',
      tag: 'final',
      latency: 'vLLM 540ms · 守卫校验通过',
      text: '“您好，我想查询订单状态。”',
      timeStr: '14:32:02.720',
      note: 'Qwen3-ASR 异步定稿 · 标点修正完成',
      pass2: '540ms'
    },
    {
      timeMs: 6200,
      action: 'start_speech_2',
      energy: '-22 dBFS',
      vad: 'Speech',
      pass1: '190ms'
    },
    {
      timeMs: 6800,
      type: 'partial',
      tag: 'partial',
      latency: '195ms',
      text: '请问预计',
      timeStr: '14:32:03.350',
      pass1: '195ms'
    },
    {
      timeMs: 7600,
      type: 'provisional',
      tag: 'provisional',
      latency: 'VAD 350ms',
      text: '请问预计什么时候发货',
      timeStr: '14:32:03.820',
      note: 'FSMN-VAD 切段提交二遍微批队列',
      vad: 'Endpoint',
      energy: '-40 dBFS'
    },
    {
      timeMs: 8800,
      type: 'final',
      tag: 'final',
      latency: 'vLLM 580ms · 守卫校验通过',
      text: '“请问预计什么时候发货？”',
      timeStr: '14:32:04.420',
      note: '高准确率标点定稿 · 交付客户端',
      pass2: '580ms'
    }
  ];

  const LOOP_TOTAL_TIME = 11500; // 11.5 seconds per full conversation cycle
  let heroTimeouts = [];
  let isHeroPaused = false;
  let waveAnimationInterval = null;

  // Initialize Waveform Bars
  function initWaveform() {
    if (!audioWaveform) return;
    audioWaveform.innerHTML = '';
    const barCount = 28;
    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('span');
      bar.className = 'wave-bar';
      // Default low baseline height
      bar.style.height = '4px';
      audioWaveform.appendChild(bar);
    }
  }

  // Animate Waveform
  function setWaveState(state) {
    if (!audioWaveform || isReducedMotion) return;
    const bars = audioWaveform.querySelectorAll('.wave-bar');
    if (state === 'active') {
      if (!waveAnimationInterval) {
        waveAnimationInterval = setInterval(() => {
          bars.forEach((bar, idx) => {
            // Simulated realistic voice harmonics
            const base = Math.sin((Date.now() / 120) + (idx * 0.45));
            const variance = Math.random() * 0.4;
            const height = Math.max(4, Math.min(22, Math.floor((base + 1.2 + variance) * 8)));
            bar.style.height = `${height}px`;
          });
        }, 80);
      }
    } else {
      if (waveAnimationInterval) {
        clearInterval(waveAnimationInterval);
        waveAnimationInterval = null;
      }
      bars.forEach(bar => {
        bar.style.height = '4px';
      });
    }
  }

  // Render a specific log line into the demo terminal
  function appendDemoEvent(item) {
    if (!demoEventsContainer) return;

    // Check if an existing line of same sequence can be updated in-place (for incremental partials)
    let targetRow = null;
    if (item.type === 'partial') {
      const lastRow = demoEventsContainer.querySelector('.stream-event-row.streaming-active');
      if (lastRow && lastRow.dataset.sentence === (item.timeMs < 6000 ? '1' : '2')) {
        targetRow = lastRow;
      }
    }

    if (!targetRow) {
      targetRow = document.createElement('div');
      targetRow.className = `stream-event-row stream-type-${item.type} animate-fade-in`;
      targetRow.dataset.sentence = item.timeMs < 6000 ? '1' : '2';
      if (item.type === 'partial') {
        targetRow.classList.add('streaming-active');
      }
      demoEventsContainer.appendChild(targetRow);
    }

    let badgeClass = 'badge-partial';
    let badgeLabel = 'partial';
    if (item.type === 'provisional') {
      badgeClass = 'badge-provisional';
      badgeLabel = 'provisional';
      // Deactivate streaming state on last row
      targetRow.classList.remove('streaming-active');
    } else if (item.type === 'final') {
      badgeClass = 'badge-final';
      badgeLabel = 'final';
      targetRow.classList.remove('streaming-active');
    }

    targetRow.innerHTML = `
      <div class="stream-event-meta">
        <span class="log-time">${item.timeStr || ''}</span>
        <span class="event-badge ${badgeClass}">${badgeLabel}</span>
        <span class="latency-pill">${item.latency}</span>
        ${item.note ? `<span class="event-note">${item.note}</span>` : ''}
      </div>
      <div class="stream-event-text text-${item.type}">
        ${item.text}
        ${item.type === 'partial' ? '<span class="typing-cursor"></span>' : ''}
      </div>
    `;

    // Keep console scrolled to latest event
    demoEventsContainer.scrollTop = demoEventsContainer.scrollHeight;
  }

  // Clear demo console
  function clearDemoConsole() {
    if (!demoEventsContainer) return;
    demoEventsContainer.innerHTML = '';
  }

  // Run the full demo sequence
  function startHeroDemoLoop() {
    // Clear any pending timeouts
    heroTimeouts.forEach(clearTimeout);
    heroTimeouts = [];

    clearDemoConsole();
    setWaveState('inactive');

    if (telemetryPass1) telemetryPass1.textContent = '200~600ms';
    if (telemetryVad) telemetryVad.textContent = 'Standby';
    if (telemetryPass2) telemetryPass2.textContent = 'Idle';
    if (audioEnergyTag) audioEnergyTag.textContent = '-55 dBFS';

    if (isReducedMotion) {
      // Render static completed state directly
      DEMO_TIMELINE.filter(item => item.type === 'final').forEach(appendDemoEvent);
      if (telemetryVad) telemetryVad.textContent = 'Connected';
      if (audioEnergyTag) audioEnergyTag.textContent = '-21 dBFS (Active)';
      return;
    }

    DEMO_TIMELINE.forEach(item => {
      const timeoutId = setTimeout(() => {
        if (isHeroPaused) return;

        if (item.action === 'start_speech_1' || item.action === 'start_speech_2') {
          setWaveState('active');
        }
        if (item.energy && audioEnergyTag) {
          audioEnergyTag.textContent = item.energy;
        }
        if (item.vad && telemetryVad) {
          telemetryVad.textContent = item.vad;
          if (item.vad === 'Endpoint' || item.vad === 'Silence') {
            setWaveState('inactive');
          }
        }
        if (item.pass1 && telemetryPass1) {
          telemetryPass1.textContent = item.pass1;
        }
        if (item.pass2 && telemetryPass2) {
          telemetryPass2.textContent = item.pass2;
        }

        if (item.type) {
          appendDemoEvent(item);
        }
      }, item.timeMs);
      heroTimeouts.push(timeoutId);
    });

    // Loop trigger
    const loopTimeout = setTimeout(() => {
      if (!isHeroPaused) {
        startHeroDemoLoop();
      }
    }, LOOP_TOTAL_TIME);
    heroTimeouts.push(loopTimeout);
  }

  // Replay Button Listener
  if (demoReplayBtn) {
    demoReplayBtn.addEventListener('click', () => {
      demoReplayBtn.classList.add('btn-clicked');
      setTimeout(() => demoReplayBtn.classList.remove('btn-clicked'), 300);
      startHeroDemoLoop();
    });
  }

  // View Tab Switcher: Live Demo vs Screenshot
  if (heroTabLive && heroTabStatic && heroStaticPanel && heroDemoContainer) {
    heroTabLive.addEventListener('click', () => {
      heroTabLive.classList.add('active');
      heroTabLive.setAttribute('aria-selected', 'true');
      heroTabStatic.classList.remove('active');
      heroTabStatic.setAttribute('aria-selected', 'false');

      heroDemoContainer.style.display = 'block';
      heroStaticPanel.style.display = 'none';
      startHeroDemoLoop();
    });

    heroTabStatic.addEventListener('click', () => {
      heroTabStatic.classList.add('active');
      heroTabStatic.setAttribute('aria-selected', 'true');
      heroTabLive.classList.remove('active');
      heroTabLive.setAttribute('aria-selected', 'false');

      heroDemoContainer.style.display = 'none';
      heroStaticPanel.style.display = 'block';
      heroTimeouts.forEach(clearTimeout);
      setWaveState('inactive');
    });
  }


  /* =========================================================================
     2. Interactive Architecture Diagram Controller
     ========================================================================= */
  const archFlowStage = document.getElementById('archFlowStage');
  const archStaticStage = document.getElementById('archStaticStage');
  const archTabFlow = document.getElementById('archTabFlow');
  const archTabStatic = document.getElementById('archTabStatic');
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

  // Architecture Tab Switcher: Dynamic Flow vs Static Topology
  if (archTabFlow && archTabStatic && archFlowStage && archStaticStage) {
    archTabFlow.addEventListener('click', () => {
      archTabFlow.classList.add('active');
      archTabFlow.setAttribute('aria-selected', 'true');
      archTabStatic.classList.remove('active');
      archTabStatic.setAttribute('aria-selected', 'false');

      archFlowStage.style.display = 'block';
      archStaticStage.style.display = 'none';
    });

    archTabStatic.addEventListener('click', () => {
      archTabStatic.classList.add('active');
      archTabStatic.setAttribute('aria-selected', 'true');
      archTabFlow.classList.remove('active');
      archTabFlow.setAttribute('aria-selected', 'false');

      archFlowStage.style.display = 'none';
      archStaticStage.style.display = 'block';
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
  });

})();
