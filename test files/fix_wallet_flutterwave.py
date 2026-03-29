#!/usr/bin/env python3
"""
Fix UnifiedWalletDashboard to integrate with Flutterwave properly
"""

import re

# Read the file
with open('apps/frontend/src/components/wallet/UnifiedWalletDashboard.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the handleAddFunds function
old_pattern = r'const handleAddFunds = async \(\) => \{[^}]+\{[^}]+\}[^}]+\}[^}]+\};'

new_function = '''const handleAddFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      // Get transaction reference from backend
      const response = await authenticatedFetch('http://localhost:8000/api/wallet/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount)
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        alert(`Error: ${result.error || 'Failed to initiate payment'}`);
        setLoading(false);
        return;
      }

      // Get Flutterwave public key from environment
      const flutterwaveKey = import.meta.env.VITE_FLUTTERWAVE_CLIENT_ID;
      
      if (!flutterwaveKey) {
        alert('Payment system not configured');
        setLoading(false);
        return;
      }

      // Open Flutterwave payment modal
      // @ts-ignore
      window.FlutterwaveCheckout({
        public_key: flutterwaveKey,
        tx_ref: result.tx_ref,
        amount: parseFloat(amount),
        currency: 'NGN',
        payment_options: 'card,mobilemoney,ussd,banktransfer',
        customer: {
          email: result.user_email,
          name: result.user_name
        },
        customizations: {
          title: 'Grooovy Wallet',
          description: 'Fund your wallet',
          logo: 'https://grooovy.com/logo.png'
        },
        callback: async (response: any) => {
          console.log('Payment response:', response);
          
          if (response.status === 'successful') {
            // Verify payment on backend
            try {
              const verifyResponse = await authenticatedFetch('http://localhost:8000/api/wallet/verify-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  tx_ref: result.tx_ref,
                  transaction_id: response.transaction_id
                })
              });
              
              const verifyResult = await verifyResponse.json();
              
              if (verifyResult.success) {
                alert('✅ Payment successful! Your wallet has been funded.');
                onSuccess();
                onClose();
                setAmount('');
              } else {
                alert('Payment verification failed. Please contact support.');
              }
            } catch (error) {
              console.error('Verification error:', error);
              alert('Payment verification failed. Please contact support.');
            }
          } else {
            alert('Payment was not completed');
          }
          
          setLoading(false);
        },
        onclose: () => {
          console.log('Payment modal closed');
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      alert('Failed to initiate payment. Please try again.');
      setLoading(false);
    }
  };'''

# Replace the function
content = re.sub(old_pattern, new_function, content, flags=re.DOTALL)

# Write back
with open('apps/frontend/src/components/wallet/UnifiedWalletDashboard.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Updated UnifiedWalletDashboard with Flutterwave integration")
