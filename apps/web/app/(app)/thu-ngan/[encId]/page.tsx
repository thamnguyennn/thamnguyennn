'use client';
import { useParams } from 'next/navigation';
import CheckoutForm from '../checkout-form';
export default function Page() { const { encId } = useParams<{ encId: string }>(); return <CheckoutForm encId={encId} />; }
