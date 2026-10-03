import {Config} from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
// Without this, renders come out full-range yuvj420p, which many players and socials show washed out
Config.setColorSpace('bt709');
Config.setAudioCodec('aac');
Config.setAudioBitrate('320k');
// GPU WebGL in headless Chrome (needed for the 3D reel, harmless for the rest)
Config.setChromiumOpenGlRenderer('angle');
