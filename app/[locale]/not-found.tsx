import { Link } from '@/i18n/routing';

export default function NotFound() {
    return (
        <div>
            <h1>Not Found</h1>
            <p>Could not find requested resource</p>
            <Link href="/">Return Home</Link>
        </div>
    )
}