import { importSync } from '@embroider/macros';
import FruitCard from '../components/fruit-card.gts';
const { default: Basket } = importSync('../utils/basket');
<template><FruitCard />{{Basket}}</template>
