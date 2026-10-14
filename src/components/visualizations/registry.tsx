import type { ComponentType } from 'react';
import type { ControlValues, VizId } from '@/types';
import { getLesson } from '@/data/lessons';
import {
  AnalogDigitalScene,
  AdvancedCodingScene,
  AmLabScene,
  ArqScene,
  CompandingScene,
  ConstellationScene,
  CodecScene,
  CrcScene,
  DeltaModScene,
  DpcmScene,
  ErrorScene,
  FmLabScene,
  HammingScene,
  InterleaveScene,
  ModCompareScene,
  ModemScene,
  NoiseScene,
  OfdmScene,
  ParityScene,
  PcmChainScene,
  PulseModScene,
  QamScene,
  QuantizerScene,
  RateCompareScene,
  ReceiverScene,
  SampleHoldScene,
  SamplingScene,
  SigmaDeltaScene,
  SnrBerScene,
  SpectrumScene,
  SpreadScene,
  WaveformScene,
} from '@/components/visualizations/scenes';
import type { SceneProps } from '@/components/visualizations/Lab';

/** Every scene shares one signature; the key differentiates persisted state. */
type Scene = ComponentType<SceneProps>;

/**
 * Which scene renders which lesson's laboratory.
 *
 * Several lessons deliberately share a scene with different starting values —
 * for example the aliasing lesson reuses the sampling laboratory because
 * aliasing *is* the failure mode of sampling. Each entry carries its own
 * defaults so the two lessons open in meaningfully different states.
 */
export const VISUALIZATIONS: Record<VizId, { scene: Scene; defaults: ControlValues; hint: string }> = {
  'digital-vs-analog': { scene: AnalogDigitalScene, defaults: { noise: 25, hops: 3, mode: 'both' }, hint: 'Same hops, same noise, different repeater.' },
  sampling: { scene: SamplingScene, defaults: { fin: 5, fs: 24, dur: 1, recon: true, showSpectrum: true }, hint: 'Break the Nyquist condition and watch reconstruction fail.' },
  'sample-hold': { scene: SampleHoldScene, defaults: { fin: 2, fs: 24, aperture: 12, droop: 15, mode: 'flat-top' }, hint: 'Natural versus flat-top, with aperture error and droop.' },
  'snr-ber': { scene: SnrBerScene, defaults: { ebn0: 9, bits: 24, scheme: 'BPSK' }, hint: 'Theory curve against a measured BER with an honest interval.' },
  'pulse-modulation': { scene: PulseModScene, defaults: { kind: 'PAM', fs: 8, dur: 1 }, hint: 'Which parameter carries the sample changes everything.' },
  'pcm-chain': { scene: PcmChainScene, defaults: { bits: 8, fs: 8, animate: true, fin: 0.9 }, hint: 'Follow one sample through the whole chain.' },
  quantizer: { scene: QuantizerScene, defaults: { bits: 4, vfsr: 2, vmin: -1, amp: 0.85, kind: 'midrise', probe: 0.5, code: true }, hint: 'Probe the sample, read the code and the error.' },
  companding: { scene: CompandingScene, defaults: { mu: 255, law: 'mu-law', showDb: false }, hint: 'Sweep μ and watch resolution move toward zero.' },
  'pcm-codec': { scene: CodecScene, defaults: { linear: 0.62, stage: 0 }, hint: 'A 12-bit sample reduced to a documented 8-bit code.' },
  dpcm: { scene: DpcmScene, defaults: { bits: 4, vmax: 1.2, corr: 2, showRecon: true }, hint: 'Same bits, applied to amplitude instead of difference.' },
  'delta-modulation': { scene: DeltaModScene, defaults: { fin: 1, amp: 1, fs: 40, step: 0.2, adaptive: false, blocks: false, highlight: true }, hint: 'Slope overload versus granular noise, live.' },
  'sigma-delta': { scene: SigmaDeltaScene, defaults: { osr: 32, fin: 1, spectrum: true }, hint: 'Watch the noise move out of the signal band.' },
  'bit-constellation': { scene: ConstellationScene, defaults: { scheme: 'PSK', order: 8, bits: '11001011', gray: true, noise: 0 }, hint: 'Type bits and watch the mapping and labelling.' },
  'mod-waveforms': { scene: WaveformScene, defaults: { scheme: 'ASK', bits: '10110100', rs: 4, fc: 18, sep: 0.14 }, hint: 'ASK, FSK and PSK on the same time base.' },
  qam: { scene: QamScene, defaults: { order: 16, noise: 0.06, ebn0: 14, symbols: 60 }, hint: 'Noise in, symbol errors out.' },
  'bit-comparison': { scene: RateCompareScene, defaults: { rb: 9600, alpha: 0.35, m: 16 }, hint: 'One bit rate, six modulations.' },
  modems: { scene: ModemScene, defaults: { family: 'all' }, hint: 'Historical reference — verify against ITU-T.' },
  ofdm: { scene: OfdmScene, defaults: { carriers: 8, cp: 0.25, bits: '1101001011110001' }, hint: 'Subcarriers, their sum, and the prefix.' },
  'spread-spectrum': { scene: SpreadScene, defaults: { mode: 'DSSS', bits: '10110', chips: '1101001011010010', channels: 6, hopSpacing: 2600 }, hint: 'Two different answers to interference.' },
  'am-lab': { scene: AmLabScene, defaults: { fm: 0.04, ma: 0.6, carrier: 30, variant: 'DSB-FC' }, hint: 'Push m past 1.0 and watch the envelope invert.' },
  'fm-lab': { scene: FmLabScene, defaults: { fm: 0.03, df: 1.2, fc: 20, mode: 'FM', pm: 1.6 }, hint: 'Deviation, index and Carson — all measured.' },
  spectrum: { scene: SpectrumScene, defaults: { scheme: 'AM', fm: 0.05, beta: 4, fc: 40, components: 6 }, hint: 'Real Bessel amplitudes, not sketches.' },
  receiver: { scene: ReceiverScene, defaults: { rf: 100, ifFreq: 10.7, injection: 'high', rejection: 30 }, hint: 'Tune it and the image moves with you.' },
  'mod-compare': { scene: ModCompareScene, defaults: { fm: 0.04, ma: 1, df: 2 }, hint: 'AM against FM against PM, side by side.' },
  'noise-lab': { scene: NoiseScene, defaults: { noise: 0.25, competing: 0.4, fm: 0.02, separation: 0.02 }, hint: 'Noise on both, then a competing FM signal.' },
  'transmission-errors': { scene: ErrorScene, defaults: { kind: 'random', rate: 0.12, burst: 3, seed: 7 }, hint: 'Random and burst errors look nothing alike.' },
  'parity-lab': { scene: ParityScene, defaults: { word: '1011001', mode: 'even', errors: 2 }, hint: 'Flip two bits and watch parity miss them.' },
  'crc-lab': { scene: CrcScene, defaults: { message: '1101', generator: '1011', flip: -1 }, hint: 'Every XOR step, then inject an error.' },
  'hamming-lab': { scene: HammingScene, defaults: { data: '1010', flip: -1 }, hint: 'The syndrome names the flipped bit.' },
  'arq-sim': { scene: ArqScene, defaults: { protocol: 'gbn', loss: 0.2, ackLoss: 0.1, window: 8, running: true }, hint: 'See exactly which frames a timeout resends.' },
  'advanced-coding': { scene: AdvancedCodingScene, defaults: { burst: 4, length: 1500 }, hint: 'Four families and their real limits.' },
  interleaving: { scene: InterleaveScene, defaults: { depth: 6, burstStart: 4, burstLen: 3, showDe: true }, hint: 'A burst becomes separated errors.' },
};

/** Renders the laboratory belonging to a lesson, merged with its defaults. */
export function VizFor({
  lessonId,
  vizId,
  accent,
}: {
  lessonId: string;
  vizId: VizId;
  accent: string;
}) {
  const entry = VISUALIZATIONS[vizId];
  const lesson = getLesson(lessonId);

  if (!entry) {
    return (
      <section className="glass p-5">
        <h2 className="display text-[14.5px] font-bold">Interactive laboratory</h2>
        <p className="mt-2 text-[13px] text-dim">
          No simulation is registered for this lesson yet. The written lesson above is complete on its own.
        </p>
      </section>
    );
  }

  const Scene = entry.scene;
  // A lesson may open its laboratory with its own starting values.
  const overrides = lesson?.vizInitial;

  return (
    <>
      <Scene key_={lessonId} overrides={overrides} />
      <p className="mt-2 px-1 text-[11.5px] leading-snug text-faint">
        <strong style={{ color: accent }}>Try this: </strong>
        {overrides && Object.keys(overrides).length > 0
          ? 'This lesson opens the laboratory with its own starting values — change them and watch what breaks.'
          : entry.hint}
      </p>
    </>
  );
}