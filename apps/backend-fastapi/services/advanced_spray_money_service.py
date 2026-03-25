"""
Advanced Spray Money Service
Enhanced tipping system with special effects, competitions, and social features
"""
import uuid
import time
import random
from typing import Dict, Any, Optional, List
from enum import Enum
from datetime import datetime, timedelta

class SprayType(str, Enum):
    SINGLE = "single"           # Regular single spray
    RAIN = "rain"              # Multiple small sprays to different users
    STORM = "storm"            # Large amount with special effects
    HURRICANE = "hurricane"     # Massive amount with premium effects
    SCHEDULED = "scheduled"     # Time-delayed spray
    RECURRING = "recurring"     # Automatic recurring sprays

class SprayEffect(str, Enum):
    NONE = "none"
    CONFETTI = "confetti"
    FIREWORKS = "fireworks"
    GOLDEN_SHOWER = "golden_shower"
    RAINBOW = "rainbow"
    LIGHTNING = "lightning"
    HEARTS = "hearts"
    STARS = "stars"

class CompetitionType(str, Enum):
    SPRAY_BATTLE = "spray_battle"       # Head-to-head spraying competition
    LEADERBOARD = "leaderboard"         # Top sprayers competition
    GOAL_BASED = "goal_based"          # Reach specific spray target
    TIME_LIMITED = "time_limited"       # Limited time spray event

class AdvancedSprayMoneyService:
    def __init__(self):
        # Enhanced spray storage
        self.spray_transactions = {}  # spray_id -> spray_data
        self.event_sprays = {}       # event_id -> [spray_ids]
        self.user_spray_history = {} # user_id -> [spray_ids]
        
        # Spray competitions
        self.active_competitions = {}  # competition_id -> competition_data
        self.competition_participants = {}  # competition_id -> [user_ids]
        
        # Scheduled sprays
        self.scheduled_sprays = {}    # schedule_id -> schedule_data
        self.recurring_sprays = {}    # recurring_id -> recurring_data
        
        # Spray multipliers and bonuses
        self.active_multipliers = {}  # event_id -> multiplier_data
        self.spray_streaks = {}      # user_id -> streak_data
        
        # Social features
        self.spray_reactions = {}     # spray_id -> [reactions]
        self.spray_comments = {}      # spray_id -> [comments]
        
        # Effect pricing (additional cost for special effects)
        self.EFFECT_COSTS = {
            SprayEffect.NONE: 0,
            SprayEffect.CONFETTI: 50,
            SprayEffect.FIREWORKS: 100,
            SprayEffect.GOLDEN_SHOWER: 200,
            SprayEffect.RAINBOW: 150,
            SprayEffect.LIGHTNING: 300,
            SprayEffect.HEARTS: 75,
            SprayEffect.STARS: 125
        }
        
        # Spray type multipliers
        self.SPRAY_MULTIPLIERS = {
            SprayType.SINGLE: 1.0,
            SprayType.RAIN: 1.2,      # 20% bonus for rain
            SprayType.STORM: 1.5,     # 50% bonus for storm
            SprayType.HURRICANE: 2.0,  # 100% bonus for hurricane
            SprayType.SCHEDULED: 1.1,  # 10% bonus for scheduled
            SprayType.RECURRING: 1.3   # 30% bonus for recurring
        }

    def create_advanced_spray(self, user_id: str, spray_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create an advanced spray with special effects and features"""
        try:
            spray_type = SprayType(spray_data.get("spray_type", SprayType.SINGLE))
            effect = SprayEffect(spray_data.get("effect", SprayEffect.NONE))
            base_amount = float(spray_data["amount"])
            event_id = spray_data["event_id"]
            
            # Calculate total cost including effects
            effect_cost = self.EFFECT_COSTS[effect]
            multiplier = self.SPRAY_MULTIPLIERS[spray_type]
            
            # Apply active event multipliers
            if event_id in self.active_multipliers:
                event_multiplier = self.active_multipliers[event_id]["multiplier"]
                multiplier *= event_multiplier
            
            total_amount = base_amount * multiplier
            total_cost = total_amount + effect_cost
            
            # Create spray record
            spray_id = str(uuid.uuid4())
            current_time = time.time()
            
            spray_record = {
                "id": spray_id,
                "user_id": user_id,
                "event_id": event_id,
                "spray_type": spray_type,
                "effect": effect,
                "base_amount": base_amount,
                "multiplier": multiplier,
                "effect_cost": effect_cost,
                "total_amount": total_amount,
                "total_cost": total_cost,
                "message": spray_data.get("message", ""),
                "is_anonymous": spray_data.get("is_anonymous", False),
                "target_users": spray_data.get("target_users", []),
                "created_at": current_time,
                "status": "pending",
                
                # Advanced features
                "reactions": [],
                "comments": [],
                "shares": 0,
                "visibility": spray_data.get("visibility", "public"),  # public, friends, private
                "tags": spray_data.get("tags", []),
                
                # Analytics
                "view_count": 0,
                "interaction_count": 0,
                "virality_score": 0
            }
            
            # Handle different spray types
            if spray_type == SprayType.RAIN:
                spray_record = self._handle_rain_spray(spray_record, spray_data)
            elif spray_type == SprayType.STORM:
                spray_record = self._handle_storm_spray(spray_record, spray_data)
            elif spray_type == SprayType.HURRICANE:
                spray_record = self._handle_hurricane_spray(spray_record, spray_data)
            elif spray_type == SprayType.SCHEDULED:
                return self._handle_scheduled_spray(spray_record, spray_data)
            elif spray_type == SprayType.RECURRING:
                return self._handle_recurring_spray(spray_record, spray_data)
            
            # Store spray
            self.spray_transactions[spray_id] = spray_record
            
            # Update indexes
            if event_id not in self.event_sprays:
                self.event_sprays[event_id] = []
            self.event_sprays[event_id].append(spray_id)
            
            if user_id not in self.user_spray_history:
                self.user_spray_history[user_id] = []
            self.user_spray_history[user_id].append(spray_id)
            
            # Update spray streak
            self._update_spray_streak(user_id, total_amount)
            
            # Process spray (deduct from wallet, add to recipients)
            processing_result = self._process_spray_payment(spray_record)
            
            if processing_result["success"]:
                spray_record["status"] = "completed"
                spray_record["processed_at"] = time.time()
                
                # Generate achievement notifications
                achievements = self._check_spray_achievements(user_id, spray_record)
                
                return {
                    "success": True,
                    "message": "Advanced spray created successfully",
                    "data": {
                        "spray": spray_record,
                        "achievements": achievements,
                        "next_streak_milestone": self._get_next_streak_milestone(user_id)
                    }
                }
            else:
                spray_record["status"] = "failed"
                spray_record["failure_reason"] = processing_result["error"]
                
                return {
                    "success": False,
                    "error": processing_result["error"],
                    "spray_id": spray_id
                }
                
        except Exception as e:
            return {"success": False, "error": f"Failed to create spray: {str(e)}"}

    def create_spray_competition(self, organizer_id: str, competition_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a spray money competition"""
        try:
            competition_id = str(uuid.uuid4())
            current_time = time.time()
            
            competition = {
                "id": competition_id,
                "organizer_id": organizer_id,
                "event_id": competition_data["event_id"],
                "type": CompetitionType(competition_data["type"]),
                "name": competition_data["name"],
                "description": competition_data.get("description", ""),
                "start_time": competition_data["start_time"],
                "end_time": competition_data["end_time"],
                "status": "upcoming",
                "created_at": current_time,
                
                # Competition rules
                "rules": {
                    "min_spray_amount": competition_data.get("min_spray_amount", 100),
                    "max_participants": competition_data.get("max_participants", 100),
                    "entry_fee": competition_data.get("entry_fee", 0),
                    "prize_pool": competition_data.get("prize_pool", 0),
                    "winner_count": competition_data.get("winner_count", 3)
                },
                
                # Prizes
                "prizes": competition_data.get("prizes", []),
                
                # Participants
                "participants": [],
                "leaderboard": [],
                
                # Statistics
                "total_sprays": 0,
                "total_amount_sprayed": 0,
                "participant_count": 0
            }
            
            # Set up competition-specific rules
            if competition["type"] == CompetitionType.SPRAY_BATTLE:
                competition["battle_pairs"] = []
                competition["current_round"] = 1
                competition["max_rounds"] = competition_data.get("max_rounds", 3)
            elif competition["type"] == CompetitionType.GOAL_BASED:
                competition["target_amount"] = competition_data["target_amount"]
                competition["current_progress"] = 0
            
            self.active_competitions[competition_id] = competition
            self.competition_participants[competition_id] = []
            
            return {
                "success": True,
                "message": "Spray competition created successfully",
                "data": {"competition": competition}
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to create competition: {str(e)}"}

    def join_spray_competition(self, user_id: str, competition_id: str) -> Dict[str, Any]:
        """Join a spray money competition"""
        try:
            if competition_id not in self.active_competitions:
                return {"success": False, "error": "Competition not found"}
            
            competition = self.active_competitions[competition_id]
            
            # Check if competition is open for registration
            current_time = time.time()
            if current_time >= competition["start_time"]:
                return {"success": False, "error": "Competition registration has closed"}
            
            # Check if user is already participating
            if user_id in self.competition_participants[competition_id]:
                return {"success": False, "error": "Already participating in this competition"}
            
            # Check participant limit
            if len(self.competition_participants[competition_id]) >= competition["rules"]["max_participants"]:
                return {"success": False, "error": "Competition is full"}
            
            # Process entry fee if required
            entry_fee = competition["rules"]["entry_fee"]
            if entry_fee > 0:
                # TODO: Deduct entry fee from user wallet
                pass
            
            # Add participant
            participant_data = {
                "user_id": user_id,
                "joined_at": current_time,
                "total_sprayed": 0,
                "spray_count": 0,
                "rank": 0,
                "achievements": []
            }
            
            competition["participants"].append(participant_data)
            self.competition_participants[competition_id].append(user_id)
            competition["participant_count"] += 1
            
            return {
                "success": True,
                "message": "Successfully joined competition",
                "data": {
                    "competition": competition,
                    "participant_data": participant_data
                }
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to join competition: {str(e)}"}

    def get_spray_leaderboard(self, event_id: str, period: str = "all_time", limit: int = 10) -> Dict[str, Any]:
        """Get enhanced spray money leaderboard with advanced features"""
        try:
            if event_id not in self.event_sprays:
                return {
                    "success": True,
                    "data": {
                        "leaderboard": [],
                        "total_sprays": 0,
                        "total_amount": 0,
                        "period": period
                    }
                }
            
            # Get sprays for the event
            spray_ids = self.event_sprays[event_id]
            sprays = [self.spray_transactions[sid] for sid in spray_ids if sid in self.spray_transactions]
            
            # Filter by period
            if period != "all_time":
                current_time = time.time()
                if period == "today":
                    start_time = current_time - (24 * 60 * 60)
                elif period == "week":
                    start_time = current_time - (7 * 24 * 60 * 60)
                elif period == "month":
                    start_time = current_time - (30 * 24 * 60 * 60)
                else:
                    start_time = 0
                
                sprays = [s for s in sprays if s["created_at"] >= start_time]
            
            # Calculate user statistics
            user_stats = {}
            for spray in sprays:
                user_id = spray["user_id"]
                if user_id not in user_stats:
                    user_stats[user_id] = {
                        "user_id": user_id,
                        "total_amount": 0,
                        "spray_count": 0,
                        "average_spray": 0,
                        "largest_spray": 0,
                        "effects_used": set(),
                        "spray_types_used": set(),
                        "streak": self.spray_streaks.get(user_id, {}).get("current_streak", 0),
                        "achievements": [],
                        "last_spray_time": 0
                    }
                
                stats = user_stats[user_id]
                stats["total_amount"] += spray["total_amount"]
                stats["spray_count"] += 1
                stats["largest_spray"] = max(stats["largest_spray"], spray["total_amount"])
                stats["effects_used"].add(spray["effect"])
                stats["spray_types_used"].add(spray["spray_type"])
                stats["last_spray_time"] = max(stats["last_spray_time"], spray["created_at"])
            
            # Calculate averages and convert sets to lists
            for stats in user_stats.values():
                if stats["spray_count"] > 0:
                    stats["average_spray"] = stats["total_amount"] / stats["spray_count"]
                stats["effects_used"] = list(stats["effects_used"])
                stats["spray_types_used"] = list(stats["spray_types_used"])
            
            # Sort by total amount (descending)
            leaderboard = sorted(user_stats.values(), key=lambda x: x["total_amount"], reverse=True)
            
            # Add ranks and limit results
            for i, entry in enumerate(leaderboard[:limit]):
                entry["rank"] = i + 1
                
                # Add special badges
                badges = []
                if entry["spray_count"] >= 100:
                    badges.append("spray_master")
                if entry["largest_spray"] >= 100000:
                    badges.append("big_spender")
                if len(entry["effects_used"]) >= 5:
                    badges.append("effect_collector")
                if entry["streak"] >= 7:
                    badges.append("streak_champion")
                
                entry["badges"] = badges
            
            # Calculate totals
            total_sprays = len(sprays)
            total_amount = sum(s["total_amount"] for s in sprays)
            
            return {
                "success": True,
                "data": {
                    "leaderboard": leaderboard[:limit],
                    "total_sprays": total_sprays,
                    "total_amount": total_amount,
                    "period": period,
                    "event_id": event_id,
                    "generated_at": time.time()
                }
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to get leaderboard: {str(e)}"}

    def get_spray_analytics(self, event_id: str) -> Dict[str, Any]:
        """Get comprehensive spray money analytics"""
        try:
            if event_id not in self.event_sprays:
                return {"success": False, "error": "No spray data found for event"}
            
            spray_ids = self.event_sprays[event_id]
            sprays = [self.spray_transactions[sid] for sid in spray_ids if sid in self.spray_transactions]
            
            if not sprays:
                return {"success": False, "error": "No spray transactions found"}
            
            # Basic statistics
            total_sprays = len(sprays)
            total_amount = sum(s["total_amount"] for s in sprays)
            average_spray = total_amount / total_sprays if total_sprays > 0 else 0
            
            # Spray type distribution
            type_distribution = {}
            for spray in sprays:
                spray_type = spray["spray_type"]
                if spray_type not in type_distribution:
                    type_distribution[spray_type] = {"count": 0, "amount": 0}
                type_distribution[spray_type]["count"] += 1
                type_distribution[spray_type]["amount"] += spray["total_amount"]
            
            # Effect usage
            effect_usage = {}
            for spray in sprays:
                effect = spray["effect"]
                if effect not in effect_usage:
                    effect_usage[effect] = {"count": 0, "total_cost": 0}
                effect_usage[effect]["count"] += 1
                effect_usage[effect]["total_cost"] += spray["effect_cost"]
            
            # Time-based analytics
            hourly_distribution = {hour: 0 for hour in range(24)}
            daily_totals = {}
            
            for spray in sprays:
                spray_time = datetime.fromtimestamp(spray["created_at"])
                hour = spray_time.hour
                date = spray_time.strftime("%Y-%m-%d")
                
                hourly_distribution[hour] += spray["total_amount"]
                
                if date not in daily_totals:
                    daily_totals[date] = {"count": 0, "amount": 0}
                daily_totals[date]["count"] += 1
                daily_totals[date]["amount"] += spray["total_amount"]
            
            # Top performers
            user_totals = {}
            for spray in sprays:
                user_id = spray["user_id"]
                if user_id not in user_totals:
                    user_totals[user_id] = 0
                user_totals[user_id] += spray["total_amount"]
            
            top_sprayers = sorted(user_totals.items(), key=lambda x: x[1], reverse=True)[:5]
            
            # Engagement metrics
            total_reactions = sum(len(spray.get("reactions", [])) for spray in sprays)
            total_comments = sum(len(spray.get("comments", [])) for spray in sprays)
            total_views = sum(spray.get("view_count", 0) for spray in sprays)
            
            analytics = {
                "basic_stats": {
                    "total_sprays": total_sprays,
                    "total_amount": total_amount,
                    "average_spray": average_spray,
                    "largest_spray": max(s["total_amount"] for s in sprays),
                    "smallest_spray": min(s["total_amount"] for s in sprays)
                },
                "type_distribution": type_distribution,
                "effect_usage": effect_usage,
                "time_analytics": {
                    "hourly_distribution": hourly_distribution,
                    "daily_totals": daily_totals,
                    "peak_hour": max(hourly_distribution, key=hourly_distribution.get),
                    "peak_day": max(daily_totals, key=lambda x: daily_totals[x]["amount"]) if daily_totals else None
                },
                "top_performers": [{"user_id": uid, "total_amount": amount} for uid, amount in top_sprayers],
                "engagement": {
                    "total_reactions": total_reactions,
                    "total_comments": total_comments,
                    "total_views": total_views,
                    "engagement_rate": (total_reactions + total_comments) / total_sprays if total_sprays > 0 else 0
                },
                "revenue_breakdown": {
                    "base_amount": sum(s["base_amount"] for s in sprays),
                    "multiplier_bonus": sum(s["total_amount"] - s["base_amount"] - s["effect_cost"] for s in sprays),
                    "effect_revenue": sum(s["effect_cost"] for s in sprays),
                    "total_revenue": total_amount
                }
            }
            
            return {
                "success": True,
                "data": analytics
            }
            
        except Exception as e:
            return {"success": False, "error": f"Failed to get analytics: {str(e)}"}

    def _handle_rain_spray(self, spray_record: Dict[str, Any], spray_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle rain spray (multiple recipients)"""
        target_count = spray_data.get("target_count", 5)
        spray_record["rain_data"] = {
            "target_count": target_count,
            "amount_per_target": spray_record["total_amount"] / target_count,
            "targets": spray_data.get("target_users", [])
        }
        return spray_record

    def _handle_storm_spray(self, spray_record: Dict[str, Any], spray_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle storm spray (large amount with effects)"""
        spray_record["storm_data"] = {
            "intensity": "high",
            "duration": 10,  # seconds
            "particle_count": 100,
            "sound_effect": "thunder"
        }
        return spray_record

    def _handle_hurricane_spray(self, spray_record: Dict[str, Any], spray_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle hurricane spray (massive amount with premium effects)"""
        spray_record["hurricane_data"] = {
            "intensity": "extreme",
            "duration": 20,  # seconds
            "particle_count": 500,
            "sound_effect": "hurricane",
            "screen_shake": True,
            "premium_animation": True
        }
        return spray_record

    def _handle_scheduled_spray(self, spray_record: Dict[str, Any], spray_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle scheduled spray (delayed execution)"""
        schedule_time = spray_data["schedule_time"]
        schedule_id = str(uuid.uuid4())
        
        scheduled_spray = {
            "id": schedule_id,
            "spray_data": spray_record,
            "schedule_time": schedule_time,
            "status": "scheduled",
            "created_at": time.time()
        }
        
        self.scheduled_sprays[schedule_id] = scheduled_spray
        
        return {
            "success": True,
            "message": "Spray scheduled successfully",
            "data": {
                "schedule_id": schedule_id,
                "scheduled_time": schedule_time,
                "spray_preview": spray_record
            }
        }

    def _handle_recurring_spray(self, spray_record: Dict[str, Any], spray_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle recurring spray (automatic repetition)"""
        recurring_id = str(uuid.uuid4())
        
        recurring_spray = {
            "id": recurring_id,
            "spray_template": spray_record,
            "frequency": spray_data["frequency"],  # daily, weekly, monthly
            "end_date": spray_data.get("end_date"),
            "max_executions": spray_data.get("max_executions"),
            "executions_count": 0,
            "next_execution": self._calculate_next_execution(spray_data["frequency"]),
            "status": "active",
            "created_at": time.time()
        }
        
        self.recurring_sprays[recurring_id] = recurring_spray
        
        return {
            "success": True,
            "message": "Recurring spray set up successfully",
            "data": {
                "recurring_id": recurring_id,
                "next_execution": recurring_spray["next_execution"],
                "frequency": spray_data["frequency"]
            }
        }

    def _process_spray_payment(self, spray_record: Dict[str, Any]) -> Dict[str, Any]:
        """Process the actual payment for spray"""
        # Mock implementation - in production, integrate with wallet service
        return {"success": True, "message": "Payment processed"}

    def _update_spray_streak(self, user_id: str, amount: float):
        """Update user's spray streak"""
        current_time = time.time()
        
        if user_id not in self.spray_streaks:
            self.spray_streaks[user_id] = {
                "current_streak": 0,
                "longest_streak": 0,
                "last_spray_date": None,
                "total_streak_amount": 0
            }
        
        streak_data = self.spray_streaks[user_id]
        
        # Check if spray is within 24 hours of last spray
        if streak_data["last_spray_date"]:
            time_diff = current_time - streak_data["last_spray_date"]
            if time_diff <= 24 * 60 * 60:  # Within 24 hours
                streak_data["current_streak"] += 1
            else:
                streak_data["current_streak"] = 1  # Reset streak
        else:
            streak_data["current_streak"] = 1
        
        # Update records
        streak_data["longest_streak"] = max(streak_data["longest_streak"], streak_data["current_streak"])
        streak_data["last_spray_date"] = current_time
        streak_data["total_streak_amount"] += amount

    def _check_spray_achievements(self, user_id: str, spray_record: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check and award spray achievements"""
        achievements = []
        
        # First spray achievement
        if user_id not in self.user_spray_history or len(self.user_spray_history[user_id]) == 1:
            achievements.append({
                "id": "first_spray",
                "name": "First Spray",
                "description": "Made your first spray money transaction",
                "reward": 100  # ₦100 bonus
            })
        
        # Large spray achievements
        amount = spray_record["total_amount"]
        if amount >= 100000:
            achievements.append({
                "id": "big_spender",
                "name": "Big Spender",
                "description": "Sprayed ₦100,000 or more in a single transaction",
                "reward": 1000
            })
        
        # Effect usage achievements
        if spray_record["effect"] != SprayEffect.NONE:
            achievements.append({
                "id": "effect_user",
                "name": "Effect Master",
                "description": "Used a special effect in your spray",
                "reward": 50
            })
        
        return achievements

    def _get_next_streak_milestone(self, user_id: str) -> Dict[str, Any]:
        """Get next streak milestone for user"""
        if user_id not in self.spray_streaks:
            return {"milestone": 3, "reward": 500, "description": "3-day spray streak"}
        
        current_streak = self.spray_streaks[user_id]["current_streak"]
        
        milestones = [3, 7, 14, 30, 60, 100]
        for milestone in milestones:
            if current_streak < milestone:
                return {
                    "milestone": milestone,
                    "reward": milestone * 100,
                    "description": f"{milestone}-day spray streak",
                    "progress": current_streak
                }
        
        return {"milestone": "max", "reward": 0, "description": "Maximum streak achieved!"}

    def _calculate_next_execution(self, frequency: str) -> float:
        """Calculate next execution time for recurring spray"""
        current_time = time.time()
        
        if frequency == "daily":
            return current_time + (24 * 60 * 60)
        elif frequency == "weekly":
            return current_time + (7 * 24 * 60 * 60)
        elif frequency == "monthly":
            return current_time + (30 * 24 * 60 * 60)
        else:
            return current_time + (24 * 60 * 60)  # Default to daily

# Global instance
advanced_spray_money_service = AdvancedSprayMoneyService()