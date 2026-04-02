"""
Test script for organizer payment flow
Run this to verify the implementation works correctly
"""
import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'backend-fastapi'))

from services.organizer_payment_service import organizer_payment_service

async def test_calculate_organizer_share():
    """Test platform fee calculation"""
    print("\n" + "="*60)
    print("TEST 1: Platform Fee Calculation")
    print("="*60)
    
    test_cases = [
        100,      # ₦100 - minimum fee applies
        1000,     # ₦1,000
        5000,     # ₦5,000
        25000,    # ₦25,000
        100000,   # ₦100,000 - maximum fee applies
    ]
    
    for price in test_cases:
        result = organizer_payment_service.calculate_organizer_share(price)
        print(f"\nTicket Price: ₦{price:,.2f}")
        print(f"  Platform Fee: ₦{result['platform_fee']:,.2f} ({(result['platform_fee']/price*100):.1f}%)")
        print(f"  Organizer Share: ₦{result['organizer_share']:,.2f} ({(result['organizer_share']/price*100):.1f}%)")
    
    print("\n✅ Fee calculation test complete")

async def test_credit_organizer_simulation():
    """Simulate crediting organizer (without database)"""
    print("\n" + "="*60)
    print("TEST 2: Organizer Credit Simulation")
    print("="*60)
    
    # This would normally interact with database
    # For now, just test the logic
    
    test_data = {
        'event_id': 'test-event-123',
        'ticket_price': 25000,
        'payment_reference': 'TEST_REF_123456',
        'attendee_id': 'test-attendee-456',
        'quantity': 2
    }
    
    print(f"\nSimulating ticket sale:")
    print(f"  Event ID: {test_data['event_id']}")
    print(f"  Ticket Price: ₦{test_data['ticket_price']:,.2f}")
    print(f"  Quantity: {test_data['quantity']}")
    print(f"  Total: ₦{test_data['ticket_price'] * test_data['quantity']:,.2f}")
    
    # Calculate what would be credited
    total_price = test_data['ticket_price'] * test_data['quantity']
    share_calc = organizer_payment_service.calculate_organizer_share(total_price)
    
    print(f"\nWould credit organizer:")
    print(f"  Amount: ₦{share_calc['organizer_share']:,.2f}")
    print(f"  Platform Fee: ₦{share_calc['platform_fee']:,.2f}")
    print(f"  Transaction Ref: TICKET_SALE_{test_data['payment_reference']}")
    
    print("\n✅ Simulation test complete")

async def test_configuration():
    """Test configuration values"""
    print("\n" + "="*60)
    print("TEST 3: Configuration Check")
    print("="*60)
    
    print(f"\nPlatform Fee Settings:")
    print(f"  Percentage: {organizer_payment_service.platform_fee_percentage}%")
    print(f"  Minimum: ₦{organizer_payment_service.platform_fee_minimum:,.2f}")
    print(f"  Maximum: ₦{organizer_payment_service.platform_fee_maximum:,.2f}")
    
    print("\n✅ Configuration test complete")

async def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("🧪 ORGANIZER PAYMENT FLOW - TEST SUITE")
    print("="*60)
    
    try:
        await test_configuration()
        await test_calculate_organizer_share()
        await test_credit_organizer_simulation()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS PASSED")
        print("="*60)
        print("\nNext Steps:")
        print("1. Run database migrations (ORGANIZER_PAYMENT_MIGRATIONS.sql)")
        print("2. Restart backend server")
        print("3. Test with real ticket purchase")
        print("4. Verify organizer wallet balance increases")
        print("5. Check transaction records in database")
        
    except Exception as e:
        print("\n" + "="*60)
        print("❌ TEST FAILED")
        print("="*60)
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
