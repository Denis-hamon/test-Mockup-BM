import React, { useEffect, useCallback, useState } from 'react';
import './App.css';
import { useTerminal } from './hooks/useTerminal.js';
import { useAsyncOutput } from './hooks/useAsyncOutput.js';
import { useKonamiCode } from './hooks/useKonamiCode.js';
import { setAsyncOutput } from './commands/index.js';
import { ASCII_KIMSUFI, VERSION } from './data/config.js';
import { t, getLang } from './i18n/index.js';
import BootScreen from './components/BootScreen.jsx';
import TerminalOutput from './components/TerminalOutput.jsx';
import TerminalInput from './components/TerminalInput.jsx';
import FloatingCard from './components/FloatingCard.jsx';
import Sidebar from './components/Sidebar.jsx';
import { line, emptyLine, asciiLines } from './commands/utils.js';

function getWelcomeLines() {
  return [
    ...asciiLines(ASCII_KIMSUFI, 'ascii-art brand'),
    emptyLine(),
    line(`<span class="kw-dim">KS-TERMINAL v${VERSION}  ·  ${t('app.edition')}</span>`),
    emptyLine(),
    line(t('welcome.greeting')),
    line(t('welcome.intro')),
    line(t('welcome.mission')),
    line(t('welcome.free_setup')),
    emptyLine(),
    line(t('welcome.type_help')),
    emptyLine(),
  ];
}

export default function App() {
  const {
    state,
    dispatch,
    inputRef,
    addLines,
    submitCommand,
    handleKeyDown,
    setInput,
    focusInput,
  } = useTerminal();

  const asyncOutput = useAsyncOutput(dispatch);
  const [konamiActive, setKonamiActive] = useState(false);

  // Konami code easter egg
  useKonamiCode(useCallback(() => {
    if (konamiActive) return;
    setKonamiActive(true);
    addLines([
      { id: Date.now(), type: 'empty' },
      { id: Date.now() + 1, type: 'html', content: `<span class="kw-green kw-bold">  ${t('konami.activated')}</span>`, className: 'glitch-text' },
      { id: Date.now() + 2, type: 'html', content: `<span class="kw-dim">  ${t('konami.msg')}</span>` },
      { id: Date.now() + 3, type: 'html', content: `<span class="kw-yellow">  ${t('konami.god_mode')}</span>` },
      { id: Date.now() + 4, type: 'empty' },
    ]);
    setTimeout(() => setKonamiActive(false), 3000);
  }, [konamiActive, addLines]));

  // Inject asyncOutput into command system
  useEffect(() => {
    setAsyncOutput(asyncOutput);
  }, [asyncOutput]);

  // Show welcome after boot with typing effect
  const handleBootDone = useCallback(async () => {
    dispatch({ type: 'SET_BOOTING', booting: false });
    dispatch({ type: 'SET_INPUT_ENABLED', enabled: false });
    const welcomeLines = getWelcomeLines();
    for (const l of welcomeLines) {
      addLines([l]);
      await new Promise((r) => setTimeout(r, l.type === 'empty' ? 20 : 45));
    }
    dispatch({ type: 'SET_INPUT_ENABLED', enabled: true });
    setTimeout(focusInput, 50);
  }, [dispatch, addLines, focusInput]);

  // Focus input on click anywhere in terminal
  const handleTerminalClick = useCallback(() => {
    focusInput();
  }, [focusInput]);

  // Handle sidebar command injection
  const handleSidebarCommand = useCallback(
    (cmd) => {
      setInput(cmd);
      focusInput();
    },
    [setInput, focusInput]
  );

  const lang = getLang();
  const dateLocale = lang === 'fr' ? 'fr-FR' : lang === 'de' ? 'de-DE' : lang === 'es' ? 'es-ES' : lang === 'it' ? 'it-IT' : lang === 'pt' ? 'pt-PT' : lang === 'nl' ? 'nl-NL' : lang === 'pl' ? 'pl-PL' : 'en-US';
  const today = new Date().toLocaleDateString(dateLocale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className={`app ${state.theme}`}>
      {state.booting && <BootScreen onDone={handleBootDone} />}

      <FloatingCard
        theme={state.theme}
        onThemeChange={(t) => dispatch({ type: 'SET_THEME', theme: t })}
      />

      <button
        className="mobile-toggle"
        onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
      >
        === {t('app.menu')}
      </button>

      <Sidebar
        open={state.sidebarOpen}
        onClose={() => dispatch({ type: 'CLOSE_SIDEBAR' })}
        onCommand={handleSidebarCommand}
      />

      {konamiActive && <div className="konami-overlay" />}

      <div className={`terminal-area ${state.theme === 'retro' ? 'retro' : ''} ${konamiActive ? 'konami-glitch' : ''}`}>
        <div className="terminal-titlebar">
          <div className="terminal-dots">
            <span className="terminal-dot red" />
            <span className="terminal-dot yellow" />
            <span className="terminal-dot green" />
          </div>
          <span className="terminal-titlebar-text">{t('app.titlebar')}</span>
        </div>

        <div className="terminal-body" onClick={handleTerminalClick}>
          <TerminalOutput lines={state.lines} />
          <TerminalInput
            value={state.input}
            onChange={setInput}
            onKeyDown={handleKeyDown}
            inputRef={inputRef}
            enabled={state.inputEnabled && !state.booting}
          />
        </div>
      </div>
    </div>
  );
}
