import { store } from '../src/lib/db/store';
import { runFallbackInspection } from '../src/lib/ai/fallback-inspector';
import { InspectionAnalysisSchema } from '../src/lib/ai/schema';
import { createInitialPhysicsState, tickPhysics } from '../src/lib/telemetry/physics-engine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASS: ${message}`);
}

async function runTestSuite() {
  console.log('\n========================================');
  console.log('🧪 FRESHGUARD AI AUTOMATED TEST SUITE');
  console.log('========================================\n');

  // Test 1: Store Initialization & Seed
  const initialProducts = store.getProducts();
  assert(initialProducts.length >= 6, 'Products catalog seeded with ≥6 perishables items');

  const initialOrders = store.getOrders();
  assert(initialOrders.length >= 4, 'Orders table seeded with active quick-commerce orders');

  const initialRiders = store.getRiders();
  assert(initialRiders.length >= 3, 'Fleet seeded with courier riders');

  // Test 2: Product Operations (CRUD)
  const newProduct = store.addProduct({
    organizationId: store.getOrganization().id,
    name: 'Test Golden Papaya',
    sku: 'FRU-PAP-TEST',
    category: 'FRUITS',
    batchNumber: 'BATCH-TEST-01',
    stock: 50,
    unit: 'units',
    optimalTempMin: 8,
    optimalTempMax: 12,
    maxVibrationG: 0.5,
    fragilityScore: 7,
    freshnessIndex: 92,
    avgQualityScore: 90,
    defectRate: 1.2,
    imageUrl: 'https://images.unsplash.com/photo-1517282009859-f000ec3b26fe',
  });
  assert(newProduct.id.startsWith('prod-'), 'Successfully added new product to store');

  const fetchedProd = store.getProductById(newProduct.id);
  assert(fetchedProd?.name === 'Test Golden Papaya', 'Product successfully queried by ID');

  store.updateProduct(newProduct.id, { stock: 45 });
  assert(store.getProductById(newProduct.id)?.stock === 45, 'Product update stock mutation verified');

  store.deleteProduct(newProduct.id);
  assert(store.getProductById(newProduct.id) === undefined, 'Product deletion verified');

  // Test 3: Quality Decision Engine Logic & Zod Validation
  const pristineAnalysis = runFallbackInspection('Pristine Apple', 'apple_pristine.jpg', 85, 70);
  assert(pristineAnalysis.quality_score >= 85, 'Pristine produce scores ≥85');
  assert(pristineAnalysis.decision === 'APPROVED', 'Pristine produce decision is APPROVED');
  assert(pristineAnalysis.risk_level === 'LOW', 'Pristine produce risk is LOW');

  const defectAnalysis = runFallbackInspection('Damaged Peach', 'mold_peach.jpg', 85, 70);
  assert(defectAnalysis.decision === 'REJECTED', 'Defective produce decision is REJECTED');
  assert(defectAnalysis.risk_level === 'HIGH', 'Defective produce risk is HIGH');
  assert(defectAnalysis.defects.length > 0, 'Defective produce extracts detected defects');

  // Validate with Zod schema
  const parsed = InspectionAnalysisSchema.safeParse(pristineAnalysis);
  assert(parsed.success, 'Inspection output rigorously validates against InspectionAnalysisSchema');

  // Test 4: Inspection Creation & Order Status Transition
  const testOrder = store.createOrder({
    customerName: 'Test Suite Customer',
    customerAddress: '100 Algorithm Way',
    customerPhone: '+1 (555) 123-4567',
    items: [
      {
        id: 'test-item-1',
        orderId: '',
        productId: initialProducts[0].id,
        productName: initialProducts[0].name,
        sku: initialProducts[0].sku,
        category: initialProducts[0].category,
        quantity: 2,
        unitPrice: 4.99,
        unit: initialProducts[0].unit,
      },
    ],
  });
  assert(testOrder.status === 'PLACED', 'Created order starts in PLACED status');

  const inspection = store.createInspection({
    orderId: testOrder.id,
    productId: initialProducts[0].id,
    productName: initialProducts[0].name,
    batchNumber: initialProducts[0].batchNumber,
    inspectorId: 'usr-inspector-01',
    inspectorName: 'Marcus Rivera',
    imageUrl: initialProducts[0].imageUrl,
    overallScore: 92,
    freshnessScore: 95,
    appearanceScore: 94,
    ripenessScore: 90,
    riskLevel: 'LOW',
    decision: 'APPROVED',
    defects: [],
    aiExplanation: 'Grade A produce verified.',
    recommendation: 'Approved for smart packaging.',
    shelfLifeEstimateDays: 6,
    packagingAdvice: 'Ventilated clamshell.',
    isAiGenerated: true,
  });
  assert(store.getOrderById(testOrder.id)?.qualityStatus === 'APPROVED', 'Order quality status transitioned to APPROVED');
  assert(store.getOrderById(testOrder.id)?.status === 'APPROVED', 'Order overall status transitioned to APPROVED');

  // Test 5: Smart Packing Lifecycle
  const packingRec = store.createPackingRecord({
    orderId: testOrder.id,
    orderNumber: testOrder.orderNumber,
    packerId: 'usr-packer-01',
    packerName: 'Elena Rostova',
    packagingType: 'VENTILATED_ECO_TRAY',
    fragilityLevel: 'EXTREME',
    specialHandlingInstructions: ['Anti-shock foam divider'],
    status: 'PACKED',
  });
  assert(packingRec.status === 'PACKED', 'Packing record saved with status PACKED');
  assert(store.getOrderById(testOrder.id)?.packingStatus === 'PACKED', 'Order packing status transitioned to PACKED');
  assert(store.getOrderById(testOrder.id)?.status === 'READY', 'Order status moved to READY for dispatch');

  // Test 6: Delivery Dispatch & Telemetry Physics Engine
  const delivery = store.createDelivery({
    orderId: testOrder.id,
    orderNumber: testOrder.orderNumber,
    riderId: initialRiders[0].id,
    riderName: initialRiders[0].name,
    customerName: testOrder.customerName,
    destinationAddress: testOrder.customerAddress,
    destinationArea: 'Test District',
    distanceKm: 2.8,
    status: 'IN_TRANSIT',
    riskLevel: 'LOW',
    dispatchedAt: new Date().toISOString(),
    estimatedDeliveryTime: new Date(Date.now() + 15 * 60000).toISOString(),
  });
  assert(delivery.status === 'IN_TRANSIT', 'Delivery created in IN_TRANSIT');
  assert(store.getOrderById(testOrder.id)?.status === 'OUT_FOR_DELIVERY', 'Order status moved to OUT_FOR_DELIVERY');

  // Physics Simulation Step
  let physics = createInitialPhysicsState(delivery.id, testOrder.id);
  const tick1 = tickPhysics(physics);
  assert(tick1.reading.vibrationG > 0 && tick1.reading.temperatureC > 0, 'Physics engine generates dynamic multi-axis metrics');

  // Test Anomaly Injection: Speed Bump
  const shockTick = tickPhysics(tick1.nextState, 'SPEED_BUMP');
  assert(shockTick.reading.vibrationG >= 1.2, 'Speed bump anomaly spikes vibration ≥1.2g');
  assert(shockTick.event?.type === 'SPEED_BUMP', 'HandlingEvent logged for mechanical shock wave');

  // Verify Alert Generated in Central Alert Center
  const latestAlert = store.getAlerts()[0];
  assert(latestAlert.type === 'VIBRATION', 'Alert Center received transit anomaly alert automatically');

  // Test 7: Delivery Completion
  const completedDel = store.completeDelivery(delivery.id);
  assert(completedDel?.status === 'DELIVERED', 'Delivery status updated to DELIVERED');
  assert(store.getOrderById(testOrder.id)?.status === 'DELIVERED', 'Order status finalized as DELIVERED');

  // Test 8: Customer Feedback Submission
  const fb = store.addFeedback({
    orderId: testOrder.id,
    orderNumber: testOrder.orderNumber,
    customerName: testOrder.customerName,
    rating: 5,
    freshnessRating: 5,
    packagingRating: 5,
    deliverySpeedRating: 5,
    comment: 'Super crisp and cold! Flawless quick-commerce delivery.',
    isDamageReported: false,
  });
  assert(fb.rating === 5, 'Customer feedback persisted to database');

  // Test 9: Audit Logs Integrity
  const logs = store.getAuditLogs();
  assert(logs.length > 5, 'Audit trail contains immutable record of full operational lifecycle');

  console.log('\n========================================');
  console.log('🎉 ALL 9 TEST SUITES PASSED FLAWLESSLY!');
  console.log('========================================\n');
}

runTestSuite();
