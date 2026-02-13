import { AccumulatorIcon } from './AccumulatorIcon';
import { DelayIcon } from './DelayIcon';
import { FilterIcon } from './FilterIcon';
import { FilterBIcon } from './FilterBIcon';
import { FilterGIcon } from './FilterGIcon';
import { FilterRIcon } from './FilterRIcon';
import { GateIcon } from './GateIcon';
import { LogicGateIcon } from './LogicGateIcon';
import { MixerIcon } from './MixerIcon';
import { MirrorIcon } from './MirrorIcon';
import { PrismIcon } from './PrismIcon';
import { ReceiverIcon } from './ReceiverIcon';
import { ReceiverBIcon } from './ReceiverBIcon';
import { ReceiverGIcon } from './ReceiverGIcon';
import { ReceiverRIcon } from './ReceiverRIcon';
import { SourceIcon } from './SourceIcon';
import { SplitterIcon } from './SplitterIcon';

import type { PieceType } from '../../engine/types';

interface PieceIconByTypeProps {
  type: PieceType;
  className?: string;
}

export function PieceIconByType({ type, className }: PieceIconByTypeProps) {
  if (type === 'SOURCE') {
    return <SourceIcon className={className} />;
  }
  if (type === 'PRISM') {
    return <PrismIcon className={className} />;
  }
  if (type === 'MIRROR') {
    return <MirrorIcon className={className} />;
  }
  if (type === 'FILTER_R') {
    return <FilterRIcon className={className} />;
  }
  if (type === 'FILTER_G') {
    return <FilterGIcon className={className} />;
  }
  if (type === 'FILTER_B') {
    return <FilterBIcon className={className} />;
  }
  if (type === 'MIXER') {
    return <MixerIcon className={className} />;
  }
  if (type === 'SPLITTER') {
    return <SplitterIcon className={className} />;
  }
  if (type === 'DELAY') {
    return <DelayIcon className={className} />;
  }
  if (type === 'GATE') {
    return <GateIcon className={className} />;
  }
  if (type === 'LOGIC_GATE') {
    return <LogicGateIcon className={className} />;
  }
  if (type === 'ACCUMULATOR') {
    return <AccumulatorIcon className={className} />;
  }
  if (type === 'RECV_R') {
    return <ReceiverRIcon className={className} />;
  }
  if (type === 'RECV_G') {
    return <ReceiverGIcon className={className} />;
  }

  return <ReceiverBIcon className={className} />;
}

export {
  AccumulatorIcon,
  DelayIcon,
  FilterBIcon,
  FilterGIcon,
  FilterIcon,
  FilterRIcon,
  GateIcon,
  LogicGateIcon,
  MixerIcon,
  MirrorIcon,
  PrismIcon,
  ReceiverBIcon,
  ReceiverGIcon,
  ReceiverIcon,
  ReceiverRIcon,
  SourceIcon,
  SplitterIcon,
};
