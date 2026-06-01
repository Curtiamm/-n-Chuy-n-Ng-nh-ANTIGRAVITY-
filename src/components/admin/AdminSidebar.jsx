export function AdminSidebar({ tabs, activeTab, onSelect }) {
  return (
    <div className="w-56 shrink-0 min-h-screen border-r border-white/10 p-4">
      <nav className="space-y-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-inter text-sm transition-all ${
              activeTab === t.id ? 'bg-[#C8A951] text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
