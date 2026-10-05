// pages/500.js
import { Link } from '@/i18n/routing';

const Custom500: React.FC = () => {
    return (
        <div>
            <h1>500 - Internal Server Error</h1>
            <p>Something went wrong on our end. Please try again later.</p>
            <Link href="/">
                Go back home
            </Link>
        </div>
    );
}

export default Custom500;