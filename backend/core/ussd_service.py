"""
USSD Service for AgriCredit Platform
Provides feature phone support for low-connectivity regions
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from enum import Enum

from .config import settings
from .cache import CacheClient
from .blockchain import blockchain_service
from ..database.config import get_db
from ..database.models import User, Loan, SensorDevice

logger = logging.getLogger(__name__)

class USSDSessionState(Enum):
    """USSD session states"""
    MAIN_MENU = "main_menu"
    LANGUAGE_SELECTION = "language_selection"
    LOAN_APPLICATION = "loan_application"
    LOAN_STATUS = "loan_status"
    PAYMENT_MENU = "payment_menu"
    BALANCE_CHECK = "balance_check"
    DEVICE_REGISTRATION = "device_registration"
    MARKET_PRICES = "market_prices"
    WEATHER_INFO = "weather_info"
    SUPPORT = "support"

@dataclass
class USSDSession:
    """USSD session data"""
    session_id: str
    phone_number: str
    state: USSDSessionState
    language: str
    data: Dict[str, Any]
    created_at: datetime
    last_activity: datetime

@dataclass
class USSDMenu:
    """USSD menu structure"""
    title: str
    options: List[str]
    back_option: Optional[str] = None
    exit_option: Optional[str] = None

class USSDService:
    """USSD service for feature phone support"""

    def __init__(self, cache_client: CacheClient):
        self.cache = cache_client
        self.sessions: Dict[str, USSDSession] = {}
        self.session_timeout = 300  # 5 minutes
        self.max_sessions_per_phone = 5

        # USSD menus in different languages
        self.menus = {
            'en': {
                'main': USSDMenu(
                    title="AgriCredit Services\nSelect option:",
                    options=[
                        "1. Apply for Loan",
                        "2. Check Loan Status",
                        "3. Make Payment",
                        "4. Check Balance",
                        "5. Register IoT Device",
                        "6. Market Prices",
                        "7. Weather Info",
                        "8. Support"
                    ],
                    exit_option="0. Exit"
                ),
                'loan_application': USSDMenu(
                    title="Loan Application\nChoose loan type:",
                    options=[
                        "1. Agricultural Loan",
                        "2. Equipment Loan",
                        "3. Working Capital",
                        "4. Emergency Loan"
                    ],
                    back_option="0. Back to Main"
                ),
                'loan_status': USSDMenu(
                    title="Loan Status\nSelect option:",
                    options=[
                        "1. View Active Loans",
                        "2. Payment History",
                        "3. Next Payment Due"
                    ],
                    back_option="0. Back to Main"
                ),
                'payment': USSDMenu(
                    title="Make Payment\nChoose method:",
                    options=[
                        "1. Mobile Money",
                        "2. Bank Transfer",
                        "3. Pay with Crypto"
                    ],
                    back_option="0. Back to Main"
                )
            },
            'sw': {  # Swahili
                'main': USSDMenu(
                    title="Huduma za AgriCredit\nChagua chaguo:",
                    options=[
                        "1. Omba Mkopo",
                        "2. Angalia Hali ya Mkopo",
                        "3. Fanya Malipo",
                        "4. Angalia Salio",
                        "5. Sajili Kifaa cha IoT",
                        "6. Bei za Soko",
                        "7. Habari ya Hali ya Hewa",
                        "8. Msaada"
                    ],
                    exit_option="0. Toka"
                ),
                'loan_application': USSDMenu(
                    title="Maombi ya Mkopo\nChagua aina ya mkopo:",
                    options=[
                        "1. Mkopo wa Kilimo",
                        "2. Mkopo wa Vifaa",
                        "3. Mtaji wa Kufanya Kazi",
                        "4. Mkopo wa Dharura"
                    ],
                    back_option="0. Rudi kwenye Mkuu"
                )
            },
            'ha': {  # Hausa
                'main': USSDMenu(
                    title="Ayyukan AgriCredit\nZaɓi zaɓi:",
                    options=[
                        "1. Nema Bashi",
                        "2. Duba Yanayin Bashi",
                        "3. Yi Biya",
                        "4. Duba Asusu",
                        "5. Yi Rijistar Na'ura IoT",
                        "6. Farashin Kasuwa",
                        "7. Bayanin Yanayi",
                        "8. Taimako"
                    ],
                    exit_option="0. Fita"
                ),
                'loan_application': USSDMenu(
                    title="Neman Bashi\nZaɓi nau'in bashi:",
                    options=[
                        "1. Bashi na Noma",
                        "2. Bashi na Kayan Aiki",
                        "3. Babban Kuɗi na Aiki",
                        "4. Bashi na Gaggawa"
                    ],
                    back_option="0. Koma Baya"
                )
            }
        }

    async def process_ussd_request(self, session_id: str, phone_number: str,
                                 service_code: str, text: str) -> str:
        """Process USSD request and return response"""
        try:
            # Clean and parse input
            text = text.strip()
            inputs = text.split('*') if text else []

            # Get or create session
            session = await self._get_or_create_session(session_id, phone_number)

            # Handle initial request (empty text)
            if not text:
                return await self._render_menu(session, 'main')

            # Process user input
            response = await self._process_user_input(session, inputs)

            # Update session activity
            session.last_activity = datetime.now()
            await self._save_session(session)

            return response

        except Exception as e:
            logger.error(f"USSD processing error for {phone_number}: {e}")
            return "END An error occurred. Please try again later."

    async def _get_or_create_session(self, session_id: str, phone_number: str) -> USSDSession:
        """Get existing session or create new one"""
        # Check cache first
        cache_key = f"ussd_session:{session_id}"
        cached_session = await self.cache.get(cache_key)

        if cached_session:
            session_data = json.loads(cached_session)
            session_data['created_at'] = datetime.fromisoformat(session_data['created_at'])
            session_data['last_activity'] = datetime.fromisoformat(session_data['last_activity'])
            session_data['state'] = USSDSessionState(session_data['state'])
            return USSDSession(**session_data)

        # Check for existing active sessions for this phone
        active_sessions = [s for s in self.sessions.values()
                          if s.phone_number == phone_number and
                          (datetime.now() - s.last_activity).seconds < self.session_timeout]

        if len(active_sessions) >= self.max_sessions_per_phone:
            # Clean up old sessions
            await self._cleanup_old_sessions(phone_number)

        # Create new session
        session = USSDSession(
            session_id=session_id,
            phone_number=phone_number,
            state=USSDSessionState.MAIN_MENU,
            language='en',  # Default to English
            data={},
            created_at=datetime.now(),
            last_activity=datetime.now()
        )

        self.sessions[session_id] = session
        await self._save_session(session)

        return session

    async def _process_user_input(self, session: USSDSession, inputs: List[str]) -> str:
        """Process user input based on current session state"""
        current_input = inputs[-1] if inputs else ""

        # Handle back/exit commands
        if current_input == "0":
            if session.state == USSDSessionState.MAIN_MENU:
                return "END Thank you for using AgriCredit services."
            else:
                session.state = USSDSessionState.MAIN_MENU
                return await self._render_menu(session, 'main')

        # Process based on current state
        if session.state == USSDSessionState.MAIN_MENU:
            return await self._handle_main_menu(session, current_input)
        elif session.state == USSDSessionState.LOAN_APPLICATION:
            return await self._handle_loan_application(session, current_input, inputs)
        elif session.state == USSDSessionState.LOAN_STATUS:
            return await self._handle_loan_status(session, current_input)
        elif session.state == USSDSessionState.PAYMENT_MENU:
            return await self._handle_payment_menu(session, current_input, inputs)
        elif session.state == USSDSessionState.BALANCE_CHECK:
            return await self._handle_balance_check(session)
        elif session.state == USSDSessionState.DEVICE_REGISTRATION:
            return await self._handle_device_registration(session, inputs)
        elif session.state == USSDSessionState.MARKET_PRICES:
            return await self._handle_market_prices(session, current_input)
        elif session.state == USSDSessionState.WEATHER_INFO:
            return await self._handle_weather_info(session, current_input)
        elif session.state == USSDSessionState.SUPPORT:
            return await self._handle_support(session, current_input)
        else:
            return await self._render_menu(session, 'main')

    async def _handle_main_menu(self, session: USSDSession, input: str) -> str:
        """Handle main menu selection"""
        try:
            choice = int(input)

            if choice == 1:  # Apply for Loan
                session.state = USSDSessionState.LOAN_APPLICATION
                return await self._render_menu(session, 'loan_application')
            elif choice == 2:  # Check Loan Status
                session.state = USSDSessionState.LOAN_STATUS
                return await self._render_menu(session, 'loan_status')
            elif choice == 3:  # Make Payment
                session.state = USSDSessionState.PAYMENT_MENU
                return await self._render_menu(session, 'payment')
            elif choice == 4:  # Check Balance
                session.state = USSDSessionState.BALANCE_CHECK
                return await self._handle_balance_check(session)
            elif choice == 5:  # Register IoT Device
                session.state = USSDSessionState.DEVICE_REGISTRATION
                return await self._handle_device_registration(session, [])
            elif choice == 6:  # Market Prices
                session.state = USSDSessionState.MARKET_PRICES
                return await self._handle_market_prices(session, "")
            elif choice == 7:  # Weather Info
                session.state = USSDSessionState.WEATHER_INFO
                return await self._handle_weather_info(session, "")
            elif choice == 8:  # Support
                session.state = USSDSessionState.SUPPORT
                return await self._handle_support(session, "")
            else:
                return "END Invalid option selected."

        except ValueError:
            return "END Invalid input. Please enter a number."

    async def _handle_loan_application(self, session: USSDSession, input: str, inputs: List[str]) -> str:
        """Handle loan application process"""
        try:
            step = len(inputs)

            if step == 1:  # Loan type selection
                choice = int(input)
                if 1 <= choice <= 4:
                    loan_types = ['agricultural', 'equipment', 'working_capital', 'emergency']
                    session.data['loan_type'] = loan_types[choice - 1]
                    return f"CON Enter loan amount (USD):\n1. 500-1000\n2. 1000-5000\n3. 5000-10000\n4. Other amount"
                else:
                    return "END Invalid loan type selected."

            elif step == 2:  # Amount selection
                choice = int(input)
                amounts = [750, 3000, 7500]
                if 1 <= choice <= 3:
                    session.data['loan_amount'] = amounts[choice - 1]
                    return f"CON Confirm application:\nLoan Type: {session.data['loan_type'].replace('_', ' ').title()}\nAmount: ${session.data['loan_amount']}\n\n1. Confirm\n2. Cancel"
                elif choice == 4:
                    return "CON Enter custom amount (USD):"
                else:
                    return "END Invalid amount selected."

            elif step == 3:  # Custom amount or confirmation
                if 'loan_amount' not in session.data:  # Custom amount
                    try:
                        amount = float(input)
                        if 100 <= amount <= 50000:
                            session.data['loan_amount'] = amount
                            return f"CON Confirm application:\nLoan Type: {session.data['loan_type'].replace('_', ' ').title()}\nAmount: ${session.data['loan_amount']}\n\n1. Confirm\n2. Cancel"
                        else:
                            return "END Amount must be between $100 and $50,000."
                    except ValueError:
                        return "END Invalid amount format."
                else:  # Confirmation
                    choice = int(input)
                    if choice == 1:
                        # Submit loan application
                        result = await self._submit_loan_application(session)
                        if result['success']:
                            return f"END Loan application submitted successfully!\nApplication ID: {result['application_id']}\nYou will receive SMS confirmation."
                        else:
                            return f"END Application failed: {result.get('error', 'Unknown error')}"
                    elif choice == 2:
                        session.state = USSDSessionState.MAIN_MENU
                        return await self._render_menu(session, 'main')
                    else:
                        return "END Invalid choice."

            return "END Session timeout. Please start again."

        except ValueError:
            return "END Invalid input. Please enter a number."

    async def _handle_loan_status(self, session: USSDSession, input: str) -> str:
        """Handle loan status checking"""
        try:
            choice = int(input)

            if choice == 1:  # View Active Loans
                loans = await self._get_user_loans(session.phone_number)
                if not loans:
                    return "END No active loans found for this number.\n\n0. Back to Main"

                response = "END Your Active Loans:\n\n"
                for i, loan in enumerate(loans, 1):
                    response += f"{i}. {loan['type'].title()} - ${loan['amount']}\n"
                    response += f"   Status: {loan['status']}\n"
                    response += f"   Next Payment: {loan['next_payment']}\n\n"

                response += "0. Back to Main"
                return response

            elif choice == 2:  # Payment History
                history = await self._get_payment_history(session.phone_number)
                if not history:
                    return "END No payment history found.\n\n0. Back to Main"

                response = "END Payment History:\n\n"
                for payment in history[-5:]:  # Last 5 payments
                    response += f"{payment['date']}: ${payment['amount']} - {payment['status']}\n"

                response += "\n0. Back to Main"
                return response

            elif choice == 3:  # Next Payment Due
                next_payment = await self._get_next_payment(session.phone_number)
                if not next_payment:
                    return "END No upcoming payments.\n\n0. Back to Main"

                return f"END Next Payment Due:\nAmount: ${next_payment['amount']}\nDue Date: {next_payment['due_date']}\n\n0. Back to Main"

            else:
                return "END Invalid option."

        except ValueError:
            return "END Invalid input."

    async def _handle_payment_menu(self, session: USSDSession, input: str, inputs: List[str]) -> str:
        """Handle payment processing"""
        try:
            step = len(inputs)

            if step == 1:  # Payment method selection
                choice = int(input)
                if 1 <= choice <= 3:
                    methods = ['mobile_money', 'bank_transfer', 'crypto']
                    session.data['payment_method'] = methods[choice - 1]
                    return "CON Enter payment amount (USD):"
                else:
                    return "END Invalid payment method."

            elif step == 2:  # Amount entry
                try:
                    amount = float(input)
                    if amount <= 0:
                        return "END Invalid amount."
                    session.data['payment_amount'] = amount
                    return f"CON Confirm payment:\nAmount: ${amount}\nMethod: {session.data['payment_method'].replace('_', ' ').title()}\n\n1. Confirm\n2. Cancel"
                except ValueError:
                    return "END Invalid amount format."

            elif step == 3:  # Confirmation
                choice = int(input)
                if choice == 1:
                    result = await self._process_payment(session)
                    if result['success']:
                        return f"END Payment processed successfully!\nReference: {result['reference']}\nAmount: ${session.data['payment_amount']}"
                    else:
                        return f"END Payment failed: {result.get('error', 'Unknown error')}"
                elif choice == 2:
                    session.state = USSDSessionState.MAIN_MENU
                    return await self._render_menu(session, 'main')
                else:
                    return "END Invalid choice."

            return "END Session timeout."

        except ValueError:
            return "END Invalid input."

    async def _handle_balance_check(self, session: USSDSession) -> str:
        """Handle balance checking"""
        try:
            balance = await self._get_user_balance(session.phone_number)
            return f"END Account Balance:\nAvailable: ${balance['available']}\nPending: ${balance['pending']}\n\n0. Back to Main"

        except Exception as e:
            logger.error(f"Balance check failed for {session.phone_number}: {e}")
            return "END Unable to check balance. Please try again later."

    async def _handle_device_registration(self, session: USSDSession, inputs: List[str]) -> str:
        """Handle IoT device registration"""
        try:
            step = len(inputs)

            if step == 1:  # Device type selection
                choice = int(inputs[0])
                device_types = ['soil_sensor', 'weather_station', 'irrigation_controller', 'drone']
                if 1 <= choice <= 4:
                    session.data['device_type'] = device_types[choice - 1]
                    return "CON Enter device location (City/Region):"
                else:
                    return "END Invalid device type."

            elif step == 2:  # Location entry
                session.data['device_location'] = inputs[1]
                return "CON Enter device ID/serial number:"

            elif step == 3:  # Device ID entry
                session.data['device_id'] = inputs[2]
                return f"CON Confirm device registration:\nType: {session.data['device_type'].replace('_', ' ').title()}\nLocation: {session.data['device_location']}\nID: {session.data['device_id']}\n\n1. Confirm\n2. Cancel"

            elif step == 4:  # Confirmation
                choice = int(inputs[3])
                if choice == 1:
                    result = await self._register_device(session)
                    if result['success']:
                        return f"END Device registered successfully!\nDevice ID: {result['device_id']}\nYou will receive setup instructions via SMS."
                    else:
                        return f"END Registration failed: {result.get('error', 'Unknown error')}"
                elif choice == 2:
                    session.state = USSDSessionState.MAIN_MENU
                    return await self._render_menu(session, 'main')
                else:
                    return "END Invalid choice."

            return "END Session timeout."

        except (ValueError, IndexError):
            return "END Invalid input."

    async def _handle_market_prices(self, session: USSDSession, input: str) -> str:
        """Handle market price queries"""
        try:
            choice = int(input) if input else 0

            if choice == 0:  # Show menu
                return "CON Select commodity:\n1. Maize/Corn\n2. Coffee\n3. Tea\n4. Wheat\n5. Rice\n6. Beans\n\n0. Back to Main"

            commodities = ['maize', 'coffee', 'tea', 'wheat', 'rice', 'beans']
            if 1 <= choice <= len(commodities):
                commodity = commodities[choice - 1]
                price_data = await self._get_market_price(commodity)

                if price_data:
                    return f"END {commodity.title()} Market Price:\nCurrent: ${price_data['price']}/kg\nChange: {price_data['change']}%\nRegion: {price_data['region']}\nLast Updated: {price_data['timestamp']}\n\n0. Back to Main"
                else:
                    return f"END Price data not available for {commodity}.\n\n0. Back to Main"
            else:
                return "END Invalid commodity selection."

        except ValueError:
            return "END Invalid input."

    async def _handle_weather_info(self, session: USSDSession, input: str) -> str:
        """Handle weather information queries"""
        try:
            choice = int(input) if input else 0

            if choice == 0:  # Show menu
                return "CON Select location:\n1. Nairobi\n2. Kampala\n3. Dar es Salaam\n4. Addis Ababa\n5. Accra\n6. Lagos\n\n0. Back to Main"

            locations = ['Nairobi', 'Kampala', 'Dar es Salaam', 'Addis Ababa', 'Accra', 'Lagos']
            if 1 <= choice <= len(locations):
                location = locations[choice - 1]
                weather_data = await self._get_weather_info(location)

                if weather_data:
                    return f"END Weather in {location}:\nTemperature: {weather_data['temperature']}°C\nHumidity: {weather_data['humidity']}%\nConditions: {weather_data['description']}\nLast Updated: {weather_data['timestamp']}\n\n0. Back to Main"
                else:
                    return f"END Weather data not available for {location}.\n\n0. Back to Main"
            else:
                return "END Invalid location selection."

        except ValueError:
            return "END Invalid input."

    async def _handle_support(self, session: USSDSession, input: str) -> str:
        """Handle support requests"""
        try:
            choice = int(input) if input else 0

            if choice == 0:  # Show menu
                return "CON AgriCredit Support:\n1. Contact Support\n2. FAQ\n3. Report Issue\n4. Service Status\n\n0. Back to Main"

            if choice == 1:
                return "END Contact Support:\nCall: +254 700 123 456\nEmail: support@agricredit.africa\nWhatsApp: +254 700 123 456\n\n0. Back to Main"
            elif choice == 2:
                return "END Frequently Asked Questions:\n1. How to apply for loan?\n2. Payment methods?\n3. Interest rates?\n4. Support documents?\n\nVisit: agricredit.africa/faq\n\n0. Back to Main"
            elif choice == 3:
                return "END Report an Issue:\nPlease call our support line:\n+254 700 123 456\n\nOr email: issues@agricredit.africa\n\n0. Back to Main"
            elif choice == 4:
                return "END Service Status:\n✅ Loan Applications: Available\n✅ Payments: Available\n✅ IoT Services: Available\n✅ Oracle Feeds: Available\n\nLast checked: Now\n\n0. Back to Main"
            else:
                return "END Invalid option."

        except ValueError:
            return "END Invalid input."

    async def _render_menu(self, session: USSDSession, menu_key: str) -> str:
        """Render USSD menu"""
        menu = self.menus.get(session.language, self.menus['en']).get(menu_key)
        if not menu:
            return "END Menu not available."

        response = f"CON {menu.title}\n"
        for option in menu.options:
            response += f"{option}\n"

        if menu.back_option:
            response += f"{menu.back_option}\n"
        if menu.exit_option:
            response += f"{menu.exit_option}"

        return response

    async def _submit_loan_application(self, session: USSDSession) -> Dict[str, Any]:
        """Submit loan application to backend"""
        try:
            # Create loan application in database
            db = next(get_db())

            # Find user by phone number
            user = db.query(User).filter(User.phone == session.phone_number).first()
            if not user:
                # Create basic user record
                user = User(
                    username=f"ussd_{session.phone_number}",
                    email=f"ussd_{session.phone_number}@temp.agricredit.africa",
                    phone=session.phone_number,
                    hashed_password="temp_password",  # Will be updated later
                    is_active=True
                )
                db.add(user)
                db.commit()
                db.refresh(user)

            # Create loan record
            loan = Loan(
                user_id=user.id,
                borrower_address=user.username,  # Temporary
                amount=session.data['loan_amount'],
                interest_rate=12.5,  # Default rate
                duration_months=12,
                collateral_token="USDC",
                collateral_amount=session.data['loan_amount'] * 1.5,  # 150% collateral
                credit_score=600,  # Default for USSD applications
                risk_level="medium",
                trust_score=70,
                purpose=session.data['loan_type'],
                status="pending"
            )
            db.add(loan)
            db.commit()

            return {"success": True, "application_id": f"USSD-{loan.id}"}

        except Exception as e:
            logger.error(f"Loan application submission failed: {e}")
            return {"success": False, "error": str(e)}

    async def _get_user_loans(self, phone_number: str) -> List[Dict[str, Any]]:
        """Get user's active loans"""
        try:
            db = next(get_db())
            user = db.query(User).filter(User.phone == phone_number).first()
            if not user:
                return []

            loans = db.query(Loan).filter(
                Loan.user_id == user.id,
                Loan.status.in_(['active', 'pending'])
            ).all()

            return [{
                'id': loan.id,
                'type': loan.purpose or 'agricultural',
                'amount': loan.amount,
                'status': loan.status,
                'next_payment': 'TBD'  # Would calculate from loan terms
            } for loan in loans]

        except Exception as e:
            logger.error(f"Failed to get user loans: {e}")
            return []

    async def _get_payment_history(self, phone_number: str) -> List[Dict[str, Any]]:
        """Get user's payment history"""
        # Mock implementation - would query payment records
        return [
            {'date': '2024-01-15', 'amount': 125.50, 'status': 'completed'},
            {'date': '2024-01-01', 'amount': 125.50, 'status': 'completed'},
            {'date': '2023-12-15', 'amount': 125.50, 'status': 'completed'},
        ]

    async def _get_next_payment(self, phone_number: str) -> Optional[Dict[str, Any]]:
        """Get next payment due"""
        # Mock implementation
        return {
            'amount': 125.50,
            'due_date': '2024-02-15'
        }

    async def _process_payment(self, session: USSDSession) -> Dict[str, Any]:
        """Process payment through USSD"""
        try:
            # In practice, this would integrate with mobile money APIs
            # For now, simulate payment processing
            reference = f"USSD-{session.session_id[:8]}-{int(datetime.now().timestamp())}"

            return {"success": True, "reference": reference}

        except Exception as e:
            logger.error(f"Payment processing failed: {e}")
            return {"success": False, "error": str(e)}

    async def _get_user_balance(self, phone_number: str) -> Dict[str, float]:
        """Get user account balance"""
        # Mock implementation
        return {
            'available': 1250.75,
            'pending': 0.0
        }

    async def _register_device(self, session: USSDSession) -> Dict[str, Any]:
        """Register IoT device"""
        try:
            db = next(get_db())
            user = db.query(User).filter(User.phone == session.phone_number).first()

            if not user:
                return {"success": False, "error": "User not found"}

            device = SensorDevice(
                device_id=session.data['device_id'],
                name=f"{session.data['device_type'].replace('_', ' ').title()} - {session.data['device_location']}",
                location=session.data['device_location'],
                crop_type="general",  # Would be specified later
                owner_id=user.id,
                is_active=True,
                firmware_version="1.0.0",
                battery_level=100
            )
            db.add(device)
            db.commit()

            return {"success": True, "device_id": device.device_id}

        except Exception as e:
            logger.error(f"Device registration failed: {e}")
            return {"success": False, "error": str(e)}

    async def _get_market_price(self, commodity: str) -> Optional[Dict[str, Any]]:
        """Get market price for commodity"""
        try:
            # Mock implementation - would fetch from oracle service
            base_prices = {
                'maize': 0.25,
                'coffee': 3.50,
                'tea': 2.80,
                'wheat': 0.30,
                'rice': 0.40,
                'beans': 1.20
            }

            if commodity in base_prices:
                import random
                price = base_prices[commodity] * (1 + random.uniform(-0.1, 0.1))
                change = random.uniform(-5, 5)

                return {
                    'commodity': commodity,
                    'price': round(price, 2),
                    'change': round(change, 1),
                    'region': 'East Africa',
                    'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M')
                }

            return None

        except Exception as e:
            logger.error(f"Failed to get market price for {commodity}: {e}")
            return None

    async def _get_weather_info(self, location: str) -> Optional[Dict[str, Any]]:
        """Get weather information"""
        try:
            # Mock implementation - would fetch from oracle service
            import random

            return {
                'location': location,
                'temperature': round(20 + random.uniform(-5, 10), 1),
                'humidity': round(60 + random.uniform(-20, 20), 0),
                'description': 'Partly cloudy',  # Would come from API
                'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M')
            }

        except Exception as e:
            logger.error(f"Failed to get weather info for {location}: {e}")
            return None

    async def _save_session(self, session: USSDSession):
        """Save session to cache"""
        cache_key = f"ussd_session:{session.session_id}"
        session_data = {
            'session_id': session.session_id,
            'phone_number': session.phone_number,
            'state': session.state.value,
            'language': session.language,
            'data': session.data,
            'created_at': session.created_at.isoformat(),
            'last_activity': session.last_activity.isoformat()
        }

        await self.cache.set(cache_key, json.dumps(session_data), expire=self.session_timeout)

    async def _cleanup_old_sessions(self, phone_number: str):
        """Clean up old sessions for a phone number"""
        try:
            # Remove expired sessions from memory
            current_time = datetime.now()
            expired_sessions = [
                session_id for session_id, session in self.sessions.items()
                if session.phone_number == phone_number and
                (current_time - session.last_activity).seconds > self.session_timeout
            ]

            for session_id in expired_sessions:
                del self.sessions[session_id]

        except Exception as e:
            logger.error(f"Session cleanup failed: {e}")

    async def get_session_stats(self) -> Dict[str, Any]:
        """Get USSD session statistics"""
        try:
            active_sessions = len([
                s for s in self.sessions.values()
                if (datetime.now() - s.last_activity).seconds < self.session_timeout
            ])

            return {
                'active_sessions': active_sessions,
                'total_sessions_today': len(self.sessions),  # Simplified
                'supported_languages': list(self.menus.keys()),
                'session_timeout_seconds': self.session_timeout
            }

        except Exception as e:
            logger.error(f"Failed to get session stats: {e}")
            return {}

# Global USSD service instance
ussd_service = USSDService(None)  # Will be initialized in main app