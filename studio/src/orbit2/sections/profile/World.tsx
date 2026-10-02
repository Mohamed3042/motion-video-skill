// PLACEHOLDER (v2): shows the v1 2D world as a framed screen at this station until its 3D world is built.
// The world builder REPLACES this file: export World = CSS 3D content (Card3D/Group3D in LOCAL coords).
import React from 'react';
import {LegacyScreen} from '../../engine/Legacy';
import {World as World2D} from './World2D';

export const World: React.FC = () => <LegacyScreen id="profile" Comp={World2D} />;
