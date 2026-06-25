import { TextLink } from '@/components/ui/TextLink';
import type { TimelineItemJson } from './schemas';

export interface TimelineItemProps {
  item: TimelineItemJson;
}

export function timelineNodeClassName({
  tone,
  projected = false,
}: {
  tone: TimelineItemJson['tone'];
  projected?: boolean;
}) {
  return ['timeline__node', `timeline__node--${tone}`, projected && 'timeline__node--projected']
    .filter(Boolean)
    .join(' ');
}

export function timelineAmountClassName(tone: TimelineItemJson['tone']) {
  return ['timeline__amount', `timeline__amount--${tone}`].join(' ');
}

export function TimelineItem({ item }: TimelineItemProps) {
  const amountTone = item.amount?.tone ?? item.tone;

  return (
    <li className="timeline__item">
      <span
        className={timelineNodeClassName({ tone: item.tone, projected: item.projected })}
        aria-hidden
      />
      <div className="timeline__content">
        <time className="timeline__time" dateTime={item.timestampLabel}>
          {item.timestampLabel}
        </time>
        <p className="timeline__title">
          {item.emoji ? <span className="timeline__emoji">{item.emoji}</span> : null}
          {item.title}
        </p>
        {item.description ? <p className="timeline__description">{item.description}</p> : null}
        {item.amount ? (
          <p className={timelineAmountClassName(amountTone)}>{item.amount.label}</p>
        ) : null}
        {item.link ? (
          <TextLink href={item.link.href} className="timeline__link">
            {item.link.label}
          </TextLink>
        ) : null}
      </div>
    </li>
  );
}
