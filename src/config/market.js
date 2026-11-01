import berlin from './markets/berlin';
import us from './markets/us';

const MARKETS = { berlin, us };

const id = (import.meta.env.VITE_MARKET || 'berlin').toLowerCase();

export default MARKETS[id] || berlin;
