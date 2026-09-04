import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useBurndown, useVelocity } from "../hooks/useAnalytics";
import { WorkloadView } from "../components/WorkloadView";
import type { BurndownPoint, VelocityPoint } from "../api";

const CHART_WIDTH = 600;
const CHART_HEIGHT = 220;
const PADDING = { top: 20, right: 20, bottom: 40, left: 48 };

const BURNDOWN_DAYS_OPTIONS = [30, 60, 90] as const;
const VELOCITY_WEEKS_OPTIONS = [4, 8, 12] as const;

type BurndownDays = (typeof BURNDOWN_DAYS_OPTIONS)[number];
type VelocityWeeks = (typeof VELOCITY_WEEKS_OPTIONS)[number];

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatWeekLabel(weekStart: string): string {
  const d = new Date(weekStart);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

interface GridLineProps {
  y: number;
  width: number;
  label: string;
}

function GridLine({ y, width, label }: GridLineProps) {
  return (
    <>
      <line
        x1={PADDING.left}
        y1={y}
        x2={PADDING.left + width}
        y2={y}
        stroke="#374151"
        strokeDasharray="4 4"
      />
      <text
        x={PADDING.left - 8}
        y={y + 4}
        textAnchor="end"
        fontSize={11}
        fill="#6b7280"
      >
        {label}
      </text>
    </>
  );
}

function BurndownChart({ data }: { data: BurndownPoint[] }) {
  const innerW = CHART_WIDTH - PADDING.left - PADDING.right;
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom;

  const maxVal = Math.max(...data.map((d) => d.remaining), 1);
  const gridCount = 4;

  const toX = (i: number) =>
    PADDING.left + (data.length > 1 ? (i / (data.length - 1)) * innerW : 0);
  const toY = (v: number) =>
    PADDING.top + innerH - (v / maxVal) * innerH;

  const points = data
    .map((d, i) => `${toX(i)},${toY(d.remaining)}`)
    .join(" ");

  const xLabels = useMemo(() => {
    if (data.length === 0) return [];
    const step = Math.max(1, Math.floor(data.length / 6));
    const indices: number[] = [];
    for (let i = 0; i < data.length; i += step) indices.push(i);
    if (indices[indices.length - 1] !== data.length - 1) {
      indices.push(data.length - 1);
    }
    return indices;
  }, [data]);

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      className="w-full"
      style={{ maxHeight: CHART_HEIGHT }}
    >
      {Array.from({ length: gridCount + 1 }, (_, i) => {
        const val = Math.round((maxVal / gridCount) * (gridCount - i));
        const y = PADDING.top + (i / gridCount) * innerH;
        return <GridLine key={i} y={y} width={innerW} label={String(val)} />;
      })}

      <polyline
        points={points}
        fill="none"
        stroke="#60a5fa"
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {data.map((d, i) => (
        <circle
          key={i}
          cx={toX(i)}
          cy={toY(d.remaining)}
          r={3}
          fill="#60a5fa"
        />
      ))}

      {xLabels.map((i) => (
        <text
          key={i}
          x={toX(i)}
          y={PADDING.top + innerH + 20}
          textAnchor="middle"
          fontSize={11}
          fill="#6b7280"
        >
          {formatDateShort(data[i].date)}
        </text>
      ))}

      <line
        x1={PADDING.left}
        y1={PADDING.top}
        x2={PADDING.left}
        y2={PADDING.top + innerH}
        stroke="#374151"
      />
      <line
        x1={PADDING.left}
        y1={PADDING.top + innerH}
        x2={PADDING.left + innerW}
        y2={PADDING.top + innerH}
        stroke="#374151"
      />
    </svg>
  );
}

const BAR_CHART_HEIGHT = 220;
const BAR_CHART_WIDTH = 600;
const BAR_PAD = { top: 20, right: 20, bottom: 48, left: 48 };

function VelocityChart({ data }: { data: VelocityPoint[] }) {
  const innerW = BAR_CHART_WIDTH - BAR_PAD.left - BAR_PAD.right;
  const innerH = BAR_CHART_HEIGHT - BAR_PAD.top - BAR_PAD.bottom;

  const maxVal = Math.max(...data.map((d) => d.completed), 1);
  const gridCount = 4;

  const barWidth = data.length > 0 ? (innerW / data.length) * 0.6 : 20;
  const barGap = data.length > 0 ? innerW / data.length : 30;

  const toBarX = (i: number) =>
    BAR_PAD.left + i * barGap + (barGap - barWidth) / 2;
  const toBarH = (v: number) => (v / maxVal) * innerH;
  const toBarY = (v: number) => BAR_PAD.top + innerH - toBarH(v);

  return (
    <svg
      viewBox={`0 0 ${BAR_CHART_WIDTH} ${BAR_CHART_HEIGHT}`}
      className="w-full"
      style={{ maxHeight: BAR_CHART_HEIGHT }}
    >
      {Array.from({ length: gridCount + 1 }, (_, i) => {
        const val = Math.round((maxVal / gridCount) * (gridCount - i));
        const y = BAR_PAD.top + (i / gridCount) * innerH;
        return <GridLine key={i} y={y} width={innerW} label={String(val)} />;
      })}

      {data.map((d, i) => {
        const h = toBarH(d.completed);
        return (
          <g key={i}>
            <rect
              x={toBarX(i)}
              y={toBarY(d.completed)}
              width={barWidth}
              height={h}
              fill="#3b82f6"
              rx={2}
            />
            {d.completed > 0 && (
              <text
                x={toBarX(i) + barWidth / 2}
                y={toBarY(d.completed) - 4}
                textAnchor="middle"
                fontSize={10}
                fill="#93c5fd"
              >
                {d.completed}
              </text>
            )}
            <text
              x={toBarX(i) + barWidth / 2}
              y={BAR_PAD.top + innerH + 16}
              textAnchor="middle"
              fontSize={10}
              fill="#6b7280"
            >
              {formatWeekLabel(d.week_start)}
            </text>
          </g>
        );
      })}

      <line
        x1={BAR_PAD.left}
        y1={BAR_PAD.top}
        x2={BAR_PAD.left}
        y2={BAR_PAD.top + innerH}
        stroke="#374151"
      />
      <line
        x1={BAR_PAD.left}
        y1={BAR_PAD.top + innerH}
        x2={BAR_PAD.left + innerW}
        y2={BAR_PAD.top + innerH}
        stroke="#374151"
      />
    </svg>
  );
}

function PeriodSelector<T extends number>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  label: (v: T) => string;
}) {
  return (
    <div className="flex gap-1">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
            value === opt
              ? "bg-blue-600 text-white"
              : "bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200"
          }`}
        >
          {label(opt)}
        </button>
      ))}
    </div>
  );
}

function ChartCard({
  title,
  controls,
  isLoading,
  isError,
  isEmpty,
  children,
}: {
  title: string;
  controls?: React.ReactNode;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-gray-800 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-100">{title}</h2>
        {controls}
      </div>
      {isLoading ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-500">
          Loading...
        </div>
      ) : isError ? (
        <div className="flex h-48 items-center justify-center text-sm text-red-400">
          Failed to load data.
        </div>
      ) : isEmpty ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-500">
          No data available for this period.
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function AnalyticsPage() {
  const { id: workspaceId = "", projectId = "" } = useParams<{
    id: string;
    projectId: string;
  }>();

  const [burndownDays, setBurndownDays] = useState<BurndownDays>(30);
  const [velocityWeeks, setVelocityWeeks] = useState<VelocityWeeks>(8);

  const { data: burndownData, isLoading: burndownLoading, isError: burndownError } =
    useBurndown(projectId, burndownDays);

  const { data: velocityData, isLoading: velocityLoading, isError: velocityError } =
    useVelocity(projectId, velocityWeeks);

  return (
    <div className="min-h-full bg-gray-900 p-6">
      <header className="mb-6">
        <div className="mb-1 flex items-center gap-2 text-sm">
          <Link
            to={`/workspaces/${workspaceId}`}
            className="text-gray-500 hover:text-gray-300 transition-colors"
          >
            Workspace
          </Link>
          <span className="text-gray-600">/</span>
          <span className="text-gray-400">Analytics</span>
        </div>
        <h1 className="text-xl font-bold text-white">Analytics</h1>
      </header>

      <div className="space-y-6">
        <ChartCard
          title="Burndown Chart"
          isLoading={burndownLoading}
          isError={burndownError}
          isEmpty={!burndownData || burndownData.length === 0}
          controls={
            <PeriodSelector
              value={burndownDays}
              options={BURNDOWN_DAYS_OPTIONS}
              onChange={setBurndownDays}
              label={(v) => `${v}d`}
            />
          }
        >
          {burndownData && burndownData.length > 0 && (
            <BurndownChart data={burndownData} />
          )}
        </ChartCard>

        <ChartCard
          title="Velocity Chart"
          isLoading={velocityLoading}
          isError={velocityError}
          isEmpty={!velocityData || velocityData.length === 0}
          controls={
            <PeriodSelector
              value={velocityWeeks}
              options={VELOCITY_WEEKS_OPTIONS}
              onChange={setVelocityWeeks}
              label={(v) => `${v}w`}
            />
          }
        >
          {velocityData && velocityData.length > 0 && (
            <VelocityChart data={velocityData} />
          )}
        </ChartCard>

        <div className="rounded-xl bg-gray-800 p-5">
          <h2 className="mb-4 text-sm font-semibold text-gray-100">
            Team Workload
          </h2>
          <WorkloadView workspaceId={workspaceId} />
        </div>
      </div>
    </div>
  );
}
