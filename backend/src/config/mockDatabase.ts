import * as fs from 'fs';
import * as path from 'path';

const DB_FILE = path.join(__dirname, '../../data/users.json');

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize empty database if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
}

export interface MockUser {
  id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  is_co_founder: boolean;
  has_lifetime_subscription: boolean;
  subscription_status: string;
  points: number;
  created_at: string;
}

class MockDatabase {
  private readDB(): { users: MockUser[] } {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  }

  private writeDB(data: { users: MockUser[] }): void {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  }

  async findUserByEmail(email: string): Promise<MockUser | null> {
    const db = this.readDB();
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  async createUser(userData: Omit<MockUser, 'id' | 'created_at'>): Promise<MockUser> {
    const db = this.readDB();
    
    const newUser: MockUser = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString()
    };
    
    db.users.push(newUser);
    this.writeDB(db);
    
    return newUser;
  }

  async getAllUsers(): Promise<MockUser[]> {
    const db = this.readDB();
    return db.users;
  }
}

export default new MockDatabase();
