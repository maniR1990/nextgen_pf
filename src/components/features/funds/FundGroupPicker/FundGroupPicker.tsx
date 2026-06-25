'use client';

export interface FundGroupOption {
  id: string;
  name: string;
  color: string | null;
  slug: string;
}

export interface FundGroupPickerValue {
  fundGroupId: string | null;
  fundGroupFlow: 'IN' | 'OUT' | null;
}

export interface FundGroupPickerProps {
  groups: FundGroupOption[];
  value: string | null;
  flow: 'IN' | 'OUT' | null;
  onChange: (v: FundGroupPickerValue) => void;
}

export function FundGroupPicker({ groups, value, flow, onChange }: FundGroupPickerProps) {
  if (groups.length === 0) {
    return <p className="fund-group-picker__empty">No fund groups — create one first.</p>;
  }

  function handleGroupChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value || null;
    onChange({ fundGroupId: id, fundGroupFlow: id ? 'IN' : null });
  }

  function handleFlowChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange({ fundGroupId: value, fundGroupFlow: e.target.value as 'IN' | 'OUT' });
  }

  return (
    <div className="fund-group-picker">
      <label className="fund-group-picker__label" htmlFor="fg-select">
        Fund Group
      </label>
      <select
        id="fg-select"
        className="fund-group-picker__select"
        value={value ?? ''}
        aria-label="Fund Group"
        onChange={handleGroupChange}
      >
        <option value="">— None —</option>
        {groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>

      {value && (
        <fieldset className="fund-group-picker__direction">
          <legend className="fund-group-picker__direction-legend">Direction</legend>
          <label className="fund-group-picker__radio-label">
            <input
              type="radio"
              name="fundGroupFlow"
              value="IN"
              checked={flow === 'IN'}
              aria-label="Saving to this fund"
              onChange={handleFlowChange}
            />
            Saving to this fund
          </label>
          <label className="fund-group-picker__radio-label">
            <input
              type="radio"
              name="fundGroupFlow"
              value="OUT"
              checked={flow === 'OUT'}
              aria-label="Using from this fund"
              onChange={handleFlowChange}
            />
            Using from this fund
          </label>
        </fieldset>
      )}
    </div>
  );
}
