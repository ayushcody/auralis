import re

with open('frontend/src/app/studio/page.tsx', 'r') as f:
    content = f.read()

# 1. Add Engine interface and state
content = content.replace(
    'interface Voice {',
    'interface Engine {\n  id: string;\n  name: string;\n}\n\ninterface Voice {'
)

state_vars = """
  const [mode, setMode] = useState<StudioMode>("clone");
  const [activeSpeakerMenu, setActiveSpeakerMenu] = useState<number | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [engines, setEngines] = useState<Engine[]>([]);
  const [selectedEngine, setSelectedEngine] = useState<string>("audio8_0_6b");
"""
content = re.sub(
    r'const \[mode, setMode\].*?const \[voices, setVoices\] = useState<Voice\[\]>\(\[\]\);',
    state_vars,
    content,
    flags=re.DOTALL
)

# 2. Fetch engines on mount
engines_fetch = """
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/engines`)
      .then((r) => r.json())
      .then((data) => {
        setEngines(data);
        if (data.length > 0 && !data.find((e: Engine) => e.id === "audio8_0_6b")) {
            setSelectedEngine(data[0].id);
        }
      })
      .catch(console.error);
  }, []);
"""
content = content.replace(
    '  useEffect(() => {\n    if (!authLoading && !user) router.replace("/");\n  }, [user, authLoading, router]);',
    engines_fetch + '\n  useEffect(() => {\n    if (!authLoading && !user) router.replace("/");\n  }, [user, authLoading, router]);'
)

# 3. Append engine to generateVoice FormData
content = content.replace(
    'formData.append("prompt", prompt);\n        if (selectedVoice) formData.append("voice_id", selectedVoice);',
    'formData.append("prompt", prompt);\n        formData.append("engine", selectedEngine);\n        if (selectedVoice) formData.append("voice_id", selectedVoice);'
)

# 4. Append engine to generateDialogue JSON
content = content.replace(
    'lines: dialogueLines.map(l => ({\n            speaker: l.type === "cloned" ? l.voiceId : l.speaker,\n            text: l.text,\n            type: l.type\n          }))\n        })',
    'engine: selectedEngine,\n          lines: dialogueLines.map(l => ({\n            speaker: l.type === "cloned" ? l.voiceId : l.speaker,\n            text: l.text,\n            type: l.type\n          }))\n        })'
)

# 5. Add dropdown UI in the clone mode
# Wait, I need to find the right place for the dropdown. Maybe near the script area.
ui_dropdown = """
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[9px] font-bold uppercase tracking-[0.1em] opacity-30 text-[var(--color-text-primary)]">Engine</label>
                      <select 
                        value={selectedEngine} 
                        onChange={(e) => setSelectedEngine(e.target.value)}
                        className="bg-[var(--color-bg-secondary)] border border-[var(--glass-border)] rounded-full px-3 py-1 text-[10px] uppercase tracking-widest focus:outline-none"
                      >
                        {engines.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                      </select>
                    </div>
"""
content = content.replace(
    '<div className="h-full flex flex-col space-y-3">\n                    <div className="flex items-center justify-between">',
    '<div className="h-full flex flex-col space-y-3">\n' + ui_dropdown + '\n                    <div className="flex items-center justify-between">'
)

with open('frontend/src/app/studio/page.tsx', 'w') as f:
    f.write(content)

