// Simple ApiKey entity/model for demonstration. Adjust fields as needed for your ORM (TypeORM, Mongoose, etc.)

export class ApiKey {
  id: string; // UUID or ObjectId
  api_key: string; // The actual API key string
  email: string;
  stripe_customer_id: string;
  is_active: boolean;
  last_used: Date;
  created_at: Date;
}