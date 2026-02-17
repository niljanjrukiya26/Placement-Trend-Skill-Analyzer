"""
Migration script to initialize TPO collection from users collection
Run this script to set up the TPO collection with test data
"""
from pymongo import MongoClient
from config import DevelopmentConfig

# Connect to MongoDB
client = MongoClient(DevelopmentConfig.MONGODB_URI)
db = client[DevelopmentConfig.DB_NAME]

def migrate_tpo_data():
    """Initialize TPO collection from users with TPO role"""
    try:
        # Check if tpo collection exists
        if 'tpo' not in db.list_collection_names():
            print("Creating 'tpo' collection...")
            db.create_collection('tpo')
        
        # Find all TPO users from users collection
        tpo_users = list(db.users.find({'role': 'TPO'}))
        
        if not tpo_users:
            print("No TPO users found in users collection")
            return
        
        # Prepare TPO records
        tpo_records = []
        for user in tpo_users:
            # Check if this TPO already exists in tpo collection
            existing = db.tpo.find_one({'userid': str(user['_id'])})
            if existing:
                print(f"TPO record already exists for {user['email']}")
                continue
            
            # Create TPO record
            tpo_record = {
                'userid': str(user['_id']),
                'tpo_id': f"TPO_{user['email'].split('@')[0].upper()}",
                'tpo_name': user.get('name', 'TPO User'),
                'branch': user.get('branch', 'IT'),  # Default branch
                'email': user['email'],
                'contact': user.get('contact', ''),
                'office_location': user.get('office_location', ''),
                'created_at': user.get('created_at'),
            }
            tpo_records.append(tpo_record)
        
        if tpo_records:
            # Insert TPO records
            result = db.tpo.insert_many(tpo_records)
            print(f"Successfully created {len(result.inserted_ids)} TPO record(s)")
            
            # Display created records
            for email in [u['email'] for u in tpo_users]:
                tpo = db.tpo.find_one({'email': email})
                print(f"  - {email} (TPO ID: {tpo['tpo_id']}, Branch: {tpo['branch']})")
        else:
            print("All TPO users already have records in tpo collection")
        
        print("\nMigration completed successfully!")
        return True
    
    except Exception as e:
        print(f"Migration failed: {str(e)}")
        return False
    
    finally:
        client.close()

if __name__ == '__main__':
    print("Starting TPO collection migration...")
    migrate_tpo_data()
