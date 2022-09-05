import { connection } from '../common';

connection.getSlot().then((slot) => console.log('Slot:', slot))
