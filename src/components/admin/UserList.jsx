export function UserList({ users, onRoleChange }) {
  return (
    <div>
      <h1 className="font-playfair text-2xl font-bold text-white mb-6">Quản lý người dùng</h1>
      <div className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="flex items-center gap-4 px-4 py-3 bg-white/10 rounded-xl border border-white/10">
            {u.picture && <img src={u.picture} alt={u.name} className="w-9 h-9 rounded-full shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="font-inter text-sm font-medium text-white truncate">{u.name}</div>
              <div className="font-inter text-xs text-white/50 truncate">{u.email}</div>
            </div>
            <select
              value={u.role}
              onChange={e => onRoleChange(u.id, e.target.value)}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-white font-inter text-xs outline-none focus:border-[#C8A951] cursor-pointer"
            >
              <option value="user" className="text-black">User</option>
              <option value="staff" className="text-black">Staff</option>
              <option value="admin" className="text-black">Admin</option>
            </select>
          </div>
        ))}
        {users.length === 0 && <div className="text-center py-12 text-white/40 font-inter text-sm">Chưa có người dùng nào đăng ký.</div>}
      </div>
    </div>
  );
}
