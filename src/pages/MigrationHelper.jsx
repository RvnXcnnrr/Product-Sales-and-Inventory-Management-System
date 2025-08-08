// Migration helper to set up store_users table and apply security rules
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Alert from '../components/ui/Alert';

const MigrationHelper = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userCount, setUserCount] = useState(0);
  const [storeCount, setStoreCount] = useState(0);
  const [storeUserCount, setStoreUserCount] = useState(0);
  const [logs, setLogs] = useState([]);

  // Add a log entry
  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date() }]);
  };

  // Run the migration
  const runMigration = async () => {
    try {
      setLoading(true);
      setStatus('Starting migration...');
      addLog('Starting migration process');

      // 1. First get all users from profiles table
      setStatus('Fetching users...');
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, store_id');

      if (profilesError) {
        throw new Error(`Failed to fetch profiles: ${profilesError.message}`);
      }

      addLog(`Found ${profiles.length} user profiles`);
      setUserCount(profiles.length);

      // 2. Get all stores
      setStatus('Fetching stores...');
      const { data: stores, error: storesError } = await supabase
        .from('stores')
        .select('id, name');

      if (storesError) {
        throw new Error(`Failed to fetch stores: ${storesError.message}`);
      }

      addLog(`Found ${stores.length} stores`);
      setStoreCount(stores.length);

      // 3. Get existing store_users entries
      setStatus('Checking existing store user mappings...');
      const { data: existingStoreUsers, error: storeUsersError } = await supabase
        .from('store_users')
        .select('store_id, user_id');

      if (storeUsersError) {
        throw new Error(`Failed to fetch store_users: ${storeUsersError.message}`);
      }

      addLog(`Found ${existingStoreUsers.length} existing store user mappings`);
      setStoreUserCount(existingStoreUsers.length);

      // 4. Find users who need to be added to a store
      const usersToAddToStore = profiles.filter(profile => {
        // Skip users who already have a store_user entry
        return !existingStoreUsers.some(su => su.user_id === profile.id);
      });

      if (usersToAddToStore.length === 0) {
        addLog('All users already have store mappings', 'success');
        setStatus('No migration needed');
        setSuccess(true);
        return;
      }

      addLog(`Found ${usersToAddToStore.length} users that need store mappings`);
      setStatus(`Adding ${usersToAddToStore.length} users to stores...`);

      // 5. Create default store if needed
      let defaultStore = stores[0];
      
      if (!defaultStore) {
        addLog('No stores found, creating a default store');
        setStatus('Creating default store...');
        
        const { data: newStore, error: createStoreError } = await supabase
          .from('stores')
          .insert([{
            name: 'Default Store',
            code: 'DEF' + Math.floor(Math.random() * 1000),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (createStoreError) {
          throw new Error(`Failed to create default store: ${createStoreError.message}`);
        }

        defaultStore = newStore;
        addLog(`Created default store: ${defaultStore.name}`, 'success');
      }

      // 6. Process each user
      for (const profile of usersToAddToStore) {
        // Determine which store to use
        let targetStoreId = profile.store_id;
        
        // If user doesn't have a store_id in their profile, use default
        if (!targetStoreId && defaultStore) {
          targetStoreId = defaultStore.id;
          
          // Also update their profile with the store_id
          await supabase
            .from('profiles')
            .update({ store_id: targetStoreId })
            .eq('id', profile.id);
            
          addLog(`Updated profile store_id for user: ${profile.email}`);
        }
        
        if (!targetStoreId) {
          addLog(`Skipping user ${profile.email} - no store_id available`, 'warning');
          continue;
        }

        // Add user to store_users
        const { error: insertError } = await supabase
          .from('store_users')
          .insert([{
            store_id: targetStoreId,
            user_id: profile.id,
            role: profile.role || 'staff',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) {
          if (insertError.code === '23505') { // Unique violation
            addLog(`User ${profile.email} already mapped to store (duplicate error)`, 'warning');
          } else {
            throw new Error(`Failed to add user ${profile.email} to store: ${insertError.message}`);
          }
        } else {
          addLog(`Added user ${profile.email} to store`, 'success');
        }
      }

      setStatus('Migration completed successfully!');
      setSuccess(true);
      addLog('Migration completed successfully!', 'success');
    } catch (err) {
      console.error('Migration failed:', err);
      setError(err.message);
      setStatus('Migration failed');
      addLog(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Authentication & Security Migration</h1>
      
      <div className="mb-6">
        <p className="mb-2">
          This utility will ensure all users are properly added to the store_users table.
          This fixes the issue where users can authenticate but aren't associated with a store.
        </p>
      </div>

      {error && (
        <Alert 
          type="error"
          title="Migration Error"
          message={error}
          className="mb-4"
        />
      )}

      {success && (
        <Alert 
          type="success"
          title="Migration Complete"
          message="All users have been successfully mapped to stores."
          className="mb-4"
        />
      )}

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex-1">
          <h3 className="font-medium text-gray-700">Users</h3>
          <p className="text-2xl font-bold">{userCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex-1">
          <h3 className="font-medium text-gray-700">Stores</h3>
          <p className="text-2xl font-bold">{storeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex-1">
          <h3 className="font-medium text-gray-700">Store Users</h3>
          <p className="text-2xl font-bold">{storeUserCount}</p>
        </div>
      </div>

      <div className="mb-6">
        <button
          onClick={runMigration}
          disabled={loading || success}
          className="btn btn-primary"
        >
          {loading ? 'Running Migration...' : success ? 'Migration Complete' : 'Run Migration'}
        </button>

        {loading && (
          <div className="mt-4 flex items-center">
            <LoadingSpinner size="sm" />
            <span className="ml-2">{status}</span>
          </div>
        )}
      </div>

      {/* Log output */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
          <h3 className="font-medium">Migration Log</h3>
        </div>
        <div className="bg-gray-900 text-gray-100 p-4 font-mono text-sm h-80 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet. Run the migration to see details.</div>
          ) : (
            logs.map((log, i) => (
              <div key={i} className={`mb-1 ${
                log.type === 'error' ? 'text-red-400' : 
                log.type === 'warning' ? 'text-yellow-400' : 
                log.type === 'success' ? 'text-green-400' : 'text-gray-300'
              }`}>
                <span className="opacity-70">[{log.timestamp.toLocaleTimeString()}]</span> {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MigrationHelper;
