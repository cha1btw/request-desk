import { CreateUsers1791801644000 } from './1791801644000-create-users';
import { CreateClientsRequestsComments1791804348000 } from './1791804348000-create-clients-requests-comments';

// Listed explicitly (instead of a glob) so it works the same for the compiled
// app and for ts-jest. New migrations are appended here, oldest first.
export const migrations = [CreateUsers1791801644000, CreateClientsRequestsComments1791804348000];
