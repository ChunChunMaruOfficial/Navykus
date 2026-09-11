import type { JuryMember } from '../types';

// Titles like «д-р» / «prof.» are written in lower case — skip them.
const initials = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean);
  const named = parts.filter((part) => /^\p{Lu}/u.test(part));
  return (named.length ? named : parts).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('');
};

/** Compact jury cards (small round portrait + name + who they are); same look on home and championship pages. */
export default function JuryCards({ members }: { members: JuryMember[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {members.map((member) => (
        <div key={member.id} className="flex items-center gap-3 rounded-xl border border-white/55 bg-white/45 p-3">
          {member.photo ? (
            <img
              src={member.photo}
              alt={member.name}
              loading="lazy"
              className="h-12 w-12 shrink-0 rounded-full border border-white/70 object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/70 bg-[#bc4638]/10 font-serif text-sm font-semibold text-[#bc4638]">
              {initials(member.name)}
            </span>
          )}
          <div className="min-w-0">
            <div className="font-serif text-lg font-semibold leading-tight text-brand-dark">{member.name}</div>
            {member.role && <div className="mt-1 text-xs leading-relaxed text-brand-slate">{member.role}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}
