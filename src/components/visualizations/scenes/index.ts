/**
 * Barrel export for every visualisation scene.
 *
 * Scenes are grouped by curriculum module to keep the files readable:
 *   modules12  — Module 1 (sampling, SNR/BER, pulse modulation, PCM chain)
 *   modules24a — Module 2 quantisation/companding + Module 3 DM/ΣΔ +
 *               Module 4 constellations, waveforms, QAM
 *   modules24b56 — Module 4 OFDM/spread/rate + Module 5 analog + Module 6 ECC
 *   reference — reference tables and comparison panels
 */
export * from './modules12';
export * from './modules24a';
export * from './modules24b56';
export * from './reference';