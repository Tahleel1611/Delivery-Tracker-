import { redirect } from 'next/navigation';
import BuyerOrdersPage from '../page';

export default async function BuyerOrdersRoute() {
  const result = await BuyerOrdersPage();
  if (!result) redirect('/buyer');
  return result;
}