import { db, auth } from './firebase-config.js';
import { 
  collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, 
  query, where, orderBy, onSnapshot 
} from 'firebase/firestore';

class FirebaseEntity {
  constructor(collectionName) {
    this.collectionName = collectionName;
  }

  async create(data) {
    const docRef = await addDoc(collection(db, this.collectionName), {
      ...data,
      created_date: new Date()
    });
    return { id: docRef.id, ...data };
  }

  async update(id, data) {
    await updateDoc(doc(db, this.collectionName, id), data);
    return { id, ...data };
  }

  async delete(id) {
    await deleteDoc(doc(db, this.collectionName, id));
  }

  async filter(conditions = {}, orderField = 'created_date', limit = null) {
    let q = query(collection(db, this.collectionName));
    
    if (conditions && Object.keys(conditions).length > 0) {
      Object.entries(conditions).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          q = query(q, where(field, 'in', value));
        } else {
          q = query(q, where(field, '==', value));
        }
      });
    }
    
    if (orderField) {
      const direction = orderField.startsWith('-') ? 'desc' : 'asc';
      const fieldName = orderField.replace(/^-/, '');
      q = query(q, orderBy(fieldName, direction));
    }
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async list() {
    const snapshot = await getDocs(collection(db, this.collectionName));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  onSnapshot(conditions, callback) {
    let q = query(collection(db, this.collectionName));
    
    if (conditions) {
      Object.entries(conditions).forEach(([field, value]) => {
        if (Array.isArray(value)) {
          q = query(q, where(field, 'in', value));
        } else {
          q = query(q, where(field, '==', value));
        }
      });
    }
    
    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    });
  }
}

// Entities
export const Product = new FirebaseEntity('products');
export const Order = new FirebaseEntity('orders');
export const Delivery = new FirebaseEntity('deliveries');
export const Vehicle = new FirebaseEntity('vehicles');
export const Warehouse = new FirebaseEntity('warehouses');
export const ChatMessage = new FirebaseEntity('chat_messages');
export const Dispute = new FirebaseEntity('disputes');
export const Advertisement = new FirebaseEntity('advertisements');
export const DeliveryAddress = new FirebaseEntity('delivery_addresses');
export const ReturnRequest = new FirebaseEntity('return_requests');
export const SiteSettings = new FirebaseEntity('site_settings');
export const SiteContent = new FirebaseEntity('site_content');
export const TransporterProfile = new FirebaseEntity('transporter_profiles');
export const AffiliateCommission = new FirebaseEntity('affiliate_commissions');
export const DeliveryRoute = new FirebaseEntity('delivery_routes');
export const ProductPack = new FirebaseEntity('product_packs');
export const PromoCode = new FirebaseEntity('promo_codes');
export const UserSubscription = new FirebaseEntity('user_subscriptions');
export const AiGeneratedQuote = new FirebaseEntity('ai_generated_quotes');
export const QuoteRequest = new FirebaseEntity('quote_requests');
export const Invoice = new FirebaseEntity('invoices');
export const Project = new FirebaseEntity('projects');
export const Task = new FirebaseEntity('tasks');
export const Driver = new FirebaseEntity('drivers');
export const Equipment = new FirebaseEntity('equipment');
export const CompanyCredit = new FirebaseEntity('company_credits');
export const SafetyReport = new FirebaseEntity('safety_reports');
export const MarketingLeadList = new FirebaseEntity('marketing_lead_lists');
export const StockItem = new FirebaseEntity('stock_items');

// Cross-app sync functions
export const syncOrderToDelivery = async (orderId, orderData) => {
  const delivery = await Delivery.create({
    order_id: orderId,
    status: 'available',
    pickup_address: orderData.pickup_address,
    delivery_address: orderData.delivery_address,
    pickup_lat: orderData.pickup_lat,
    pickup_lng: orderData.pickup_lng,
    delivery_lat: orderData.delivery_lat,
    delivery_lng: orderData.delivery_lng,
    customer_name: orderData.customer_name,
    vendor_name: orderData.vendor_name,
    materials: orderData.items,
    total_weight_kg: orderData.total_weight_kg
  });
  await Order.update(orderId, { delivery_id: delivery.id, delivery_status: 'available' });
  return delivery;
};

export const syncDeliveryToOrder = async (deliveryId, status) => {
  const deliveryDoc = await getDoc(doc(db, 'deliveries', deliveryId));
  if (deliveryDoc.exists()) {
    const orderId = deliveryDoc.data().order_id;
    if (orderId) {
      await Order.update(orderId, { delivery_status: status });
    }
  }
};

// User auth wrapper
export const User = {
  me: async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    return { id: user.uid, ...userDoc.data() };
  },
  
  updateMyUserData: async (data) => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    await updateDoc(doc(db, 'users', user.uid), data);
  },

  list: async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  update: async (id, data) => {
    await updateDoc(doc(db, 'users', id), data);
    return { id, ...data };
  },

  filter: async (conditions = {}) => {
    const snapshot = await getDocs(collection(db, 'users'));
    let users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (conditions && Object.keys(conditions).length > 0) {
      users = users.filter(user => {
        for (const [field, value] of Object.entries(conditions)) {
          if (Array.isArray(value)) {
            if (!value.includes(user[field])) return false;
          } else {
            if (user[field] !== value) return false;
          }
        }
        return true;
      });
    }
    
    return users;
  }
};
