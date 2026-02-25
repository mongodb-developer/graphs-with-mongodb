// Seed script — runs via postCreateCommand after the devcontainer is up.
// Re-running is safe: each collection is dropped and recreated.
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI ?? 'mongodb://admin:mongodb@localhost:27017/?directConnection=true';

const DATA = {
  // ── A. GRAPH PATTERN ────────────────────────────────────────────────────
  graph_data_centers: [
    { _id: 'dc1', name: 'Data Center West',    location: 'San Jose, CA',    features: ['Tier III certified', '24/7 staffing', 'Redundant power'],   connected_datacenters: ['dc2', 'dc3'] },
    { _id: 'dc2', name: 'Data Center South',   location: 'Los Angeles, CA', features: ['Tier III certified', 'On-site security', '25GbE uplink'],   connected_datacenters: ['dc1', 'dc4'] },
    { _id: 'dc3', name: 'Data Center North',   location: 'Seattle, WA',     features: ['Tier II certified', '24/7 staffing', 'UPS backup'],          connected_datacenters: ['dc1', 'dc4'] },
    { _id: 'dc4', name: 'Data Center Central', location: 'Denver, CO',      features: ['Tier III certified', 'Redundant power', 'Fire suppression'], connected_datacenters: ['dc2', 'dc3', 'dc5'] },
    { _id: 'dc5', name: 'Data Center East',    location: 'Dallas, TX',      features: ['Tier IV certified', '24/7 staffing', 'Biometric access'],    connected_datacenters: ['dc4'] },
  ],
  graph_routers: [
    { _id: 'r1',  hostname: 'router-west-1', data_center: 'dc1', location: 'San Jose, CA',    features: ['BGP', 'IPv6', 'QoS'],          connected_routers: ['r2', 'r3', 'r5']  },
    { _id: 'r2',  hostname: 'router-west-2', data_center: 'dc1', location: 'San Jose, CA',    features: ['BGP', 'OSPF', 'Low Latency'],  connected_routers: ['r1', 'r4']        },
    { _id: 'r3',  hostname: 'router-la-1',   data_center: 'dc2', location: 'Los Angeles, CA', features: ['MPLS', 'BGP', 'IPv6'],         connected_routers: ['r1', 'r4', 'r6']  },
    { _id: 'r4',  hostname: 'router-la-2',   data_center: 'dc2', location: 'Los Angeles, CA', features: ['MPLS', 'QoS', 'OSPF'],         connected_routers: ['r2', 'r3', 'r7']  },
    { _id: 'r5',  hostname: 'router-sea-1',  data_center: 'dc3', location: 'Seattle, WA',     features: ['BGP', 'IPv6', 'OSPF'],         connected_routers: ['r1', 'r6', 'r8']  },
    { _id: 'r6',  hostname: 'router-sea-2',  data_center: 'dc3', location: 'Seattle, WA',     features: ['OSPF', 'Low Latency', 'MPLS'], connected_routers: ['r3', 'r5', 'r9']  },
    { _id: 'r7',  hostname: 'router-den-1',  data_center: 'dc4', location: 'Denver, CO',      features: ['BGP', 'OSPF', 'IPv6'],         connected_routers: ['r4', 'r8', 'r10'] },
    { _id: 'r8',  hostname: 'router-den-2',  data_center: 'dc4', location: 'Denver, CO',      features: ['MPLS', 'QoS', 'OSPF'],         connected_routers: ['r5', 'r7', 'r9']  },
    { _id: 'r9',  hostname: 'router-dal-1',  data_center: 'dc5', location: 'Dallas, TX',      features: ['BGP', 'IPv6', 'MPLS'],         connected_routers: ['r6', 'r8', 'r10'] },
    { _id: 'r10', hostname: 'router-dal-2',  data_center: 'dc5', location: 'Dallas, TX',      features: ['BGP', 'QoS', 'Low Latency'],   connected_routers: ['r7', 'r9']        },
  ],
  graph_network_cards: [
    { _id: 'nc1',  serial_number: 'NC-10001', router: 'r1',  location: 'San Jose, CA',    features: ['10GbE', 'SR-IOV', 'Low Latency'],  port_count: 4, speed_gbps: 10  },
    { _id: 'nc2',  serial_number: 'NC-10002', router: 'r1',  location: 'San Jose, CA',    features: ['25GbE', 'RDMA'],                   port_count: 2, speed_gbps: 25  },
    { _id: 'nc3',  serial_number: 'NC-10003', router: 'r2',  location: 'San Jose, CA',    features: ['10GbE', 'SR-IOV'],                 port_count: 4, speed_gbps: 10  },
    { _id: 'nc4',  serial_number: 'NC-10004', router: 'r3',  location: 'Los Angeles, CA', features: ['100GbE', 'DPDK'],                  port_count: 2, speed_gbps: 100 },
    { _id: 'nc5',  serial_number: 'NC-10005', router: 'r3',  location: 'Los Angeles, CA', features: ['25GbE', 'RDMA', 'SR-IOV'],         port_count: 4, speed_gbps: 25  },
    { _id: 'nc6',  serial_number: 'NC-10006', router: 'r4',  location: 'Los Angeles, CA', features: ['10GbE', 'Low Latency'],            port_count: 8, speed_gbps: 10  },
    { _id: 'nc7',  serial_number: 'NC-10007', router: 'r5',  location: 'Seattle, WA',     features: ['25GbE', 'IPv6 offload'],           port_count: 2, speed_gbps: 25  },
    { _id: 'nc8',  serial_number: 'NC-10008', router: 'r5',  location: 'Seattle, WA',     features: ['100GbE', 'DPDK', 'SR-IOV'],        port_count: 2, speed_gbps: 100 },
    { _id: 'nc9',  serial_number: 'NC-10009', router: 'r6',  location: 'Seattle, WA',     features: ['10GbE', 'QoS offload'],            port_count: 4, speed_gbps: 10  },
    { _id: 'nc10', serial_number: 'NC-10010', router: 'r7',  location: 'Denver, CO',      features: ['25GbE', 'RDMA'],                   port_count: 4, speed_gbps: 25  },
    { _id: 'nc11', serial_number: 'NC-10011', router: 'r7',  location: 'Denver, CO',      features: ['10GbE', 'SR-IOV'],                 port_count: 8, speed_gbps: 10  },
    { _id: 'nc12', serial_number: 'NC-10012', router: 'r8',  location: 'Denver, CO',      features: ['100GbE', 'DPDK'],                  port_count: 2, speed_gbps: 100 },
    { _id: 'nc13', serial_number: 'NC-10013', router: 'r9',  location: 'Dallas, TX',      features: ['25GbE', 'RDMA', 'SR-IOV'],         port_count: 4, speed_gbps: 25  },
    { _id: 'nc14', serial_number: 'NC-10014', router: 'r9',  location: 'Dallas, TX',      features: ['10GbE', 'Low Latency'],            port_count: 4, speed_gbps: 10  },
    { _id: 'nc15', serial_number: 'NC-10015', router: 'r10', location: 'Dallas, TX',      features: ['25GbE', 'QoS offload'],            port_count: 2, speed_gbps: 25  },
  ],

  // ── B. TREE PATTERN ─────────────────────────────────────────────────────
  tree_data_centers: [
    { _id: 'dc1', name: 'Data Center West',    location: 'San Jose, CA',    features: ['Tier III certified', '24/7 staffing', 'Redundant power'],   connected_datacenters: ['dc2', 'dc3'], ancestors: [] },
    { _id: 'dc2', name: 'Data Center South',   location: 'Los Angeles, CA', features: ['Tier III certified', 'On-site security', '25GbE uplink'],   connected_datacenters: ['dc1', 'dc4'], ancestors: [] },
    { _id: 'dc3', name: 'Data Center North',   location: 'Seattle, WA',     features: ['Tier II certified', '24/7 staffing', 'UPS backup'],          connected_datacenters: ['dc1', 'dc4'], ancestors: [] },
    { _id: 'dc4', name: 'Data Center Central', location: 'Denver, CO',      features: ['Tier III certified', 'Redundant power', 'Fire suppression'], connected_datacenters: ['dc2', 'dc3', 'dc5'], ancestors: [] },
    { _id: 'dc5', name: 'Data Center East',    location: 'Dallas, TX',      features: ['Tier IV certified', '24/7 staffing', 'Biometric access'],    connected_datacenters: ['dc4'], ancestors: [] },
  ],
  tree_routers: [
    { _id: 'r1',  hostname: 'router-west-1', data_center: 'dc1', location: 'San Jose, CA',    features: ['BGP', 'IPv6', 'QoS'],          connected_routers: ['r2', 'r3', 'r5'],  ancestors: ['dc1'] },
    { _id: 'r2',  hostname: 'router-west-2', data_center: 'dc1', location: 'San Jose, CA',    features: ['BGP', 'OSPF', 'Low Latency'],  connected_routers: ['r1', 'r4'],        ancestors: ['dc1'] },
    { _id: 'r3',  hostname: 'router-la-1',   data_center: 'dc2', location: 'Los Angeles, CA', features: ['MPLS', 'BGP', 'IPv6'],         connected_routers: ['r1', 'r4', 'r6'],  ancestors: ['dc2'] },
    { _id: 'r4',  hostname: 'router-la-2',   data_center: 'dc2', location: 'Los Angeles, CA', features: ['MPLS', 'QoS', 'OSPF'],         connected_routers: ['r2', 'r3', 'r7'],  ancestors: ['dc2'] },
    { _id: 'r5',  hostname: 'router-sea-1',  data_center: 'dc3', location: 'Seattle, WA',     features: ['BGP', 'IPv6', 'OSPF'],         connected_routers: ['r1', 'r6', 'r8'],  ancestors: ['dc3'] },
    { _id: 'r6',  hostname: 'router-sea-2',  data_center: 'dc3', location: 'Seattle, WA',     features: ['OSPF', 'Low Latency', 'MPLS'], connected_routers: ['r3', 'r5', 'r9'],  ancestors: ['dc3'] },
    { _id: 'r7',  hostname: 'router-den-1',  data_center: 'dc4', location: 'Denver, CO',      features: ['BGP', 'OSPF', 'IPv6'],         connected_routers: ['r4', 'r8', 'r10'], ancestors: ['dc4'] },
    { _id: 'r8',  hostname: 'router-den-2',  data_center: 'dc4', location: 'Denver, CO',      features: ['MPLS', 'QoS', 'OSPF'],         connected_routers: ['r5', 'r7', 'r9'],  ancestors: ['dc4'] },
    { _id: 'r9',  hostname: 'router-dal-1',  data_center: 'dc5', location: 'Dallas, TX',      features: ['BGP', 'IPv6', 'MPLS'],         connected_routers: ['r6', 'r8', 'r10'], ancestors: ['dc5'] },
    { _id: 'r10', hostname: 'router-dal-2',  data_center: 'dc5', location: 'Dallas, TX',      features: ['BGP', 'QoS', 'Low Latency'],   connected_routers: ['r7', 'r9'],        ancestors: ['dc5'] },
  ],
  tree_network_cards: [
    { _id: 'nc1',  serial_number: 'NC-10001', router: 'r1',  location: 'San Jose, CA',    features: ['10GbE', 'SR-IOV', 'Low Latency'],  port_count: 4, speed_gbps: 10,  ancestors: ['dc1', 'r1']  },
    { _id: 'nc2',  serial_number: 'NC-10002', router: 'r1',  location: 'San Jose, CA',    features: ['25GbE', 'RDMA'],                   port_count: 2, speed_gbps: 25,  ancestors: ['dc1', 'r1']  },
    { _id: 'nc3',  serial_number: 'NC-10003', router: 'r2',  location: 'San Jose, CA',    features: ['10GbE', 'SR-IOV'],                 port_count: 4, speed_gbps: 10,  ancestors: ['dc1', 'r2']  },
    { _id: 'nc4',  serial_number: 'NC-10004', router: 'r3',  location: 'Los Angeles, CA', features: ['100GbE', 'DPDK'],                  port_count: 2, speed_gbps: 100, ancestors: ['dc2', 'r3']  },
    { _id: 'nc5',  serial_number: 'NC-10005', router: 'r3',  location: 'Los Angeles, CA', features: ['25GbE', 'RDMA', 'SR-IOV'],         port_count: 4, speed_gbps: 25,  ancestors: ['dc2', 'r3']  },
    { _id: 'nc6',  serial_number: 'NC-10006', router: 'r4',  location: 'Los Angeles, CA', features: ['10GbE', 'Low Latency'],            port_count: 8, speed_gbps: 10,  ancestors: ['dc2', 'r4']  },
    { _id: 'nc7',  serial_number: 'NC-10007', router: 'r5',  location: 'Seattle, WA',     features: ['25GbE', 'IPv6 offload'],           port_count: 2, speed_gbps: 25,  ancestors: ['dc3', 'r5']  },
    { _id: 'nc8',  serial_number: 'NC-10008', router: 'r5',  location: 'Seattle, WA',     features: ['100GbE', 'DPDK', 'SR-IOV'],        port_count: 2, speed_gbps: 100, ancestors: ['dc3', 'r5']  },
    { _id: 'nc9',  serial_number: 'NC-10009', router: 'r6',  location: 'Seattle, WA',     features: ['10GbE', 'QoS offload'],            port_count: 4, speed_gbps: 10,  ancestors: ['dc3', 'r6']  },
    { _id: 'nc10', serial_number: 'NC-10010', router: 'r7',  location: 'Denver, CO',      features: ['25GbE', 'RDMA'],                   port_count: 4, speed_gbps: 25,  ancestors: ['dc4', 'r7']  },
    { _id: 'nc11', serial_number: 'NC-10011', router: 'r7',  location: 'Denver, CO',      features: ['10GbE', 'SR-IOV'],                 port_count: 8, speed_gbps: 10,  ancestors: ['dc4', 'r7']  },
    { _id: 'nc12', serial_number: 'NC-10012', router: 'r8',  location: 'Denver, CO',      features: ['100GbE', 'DPDK'],                  port_count: 2, speed_gbps: 100, ancestors: ['dc4', 'r8']  },
    { _id: 'nc13', serial_number: 'NC-10013', router: 'r9',  location: 'Dallas, TX',      features: ['25GbE', 'RDMA', 'SR-IOV'],         port_count: 4, speed_gbps: 25,  ancestors: ['dc5', 'r9']  },
    { _id: 'nc14', serial_number: 'NC-10014', router: 'r9',  location: 'Dallas, TX',      features: ['10GbE', 'Low Latency'],            port_count: 4, speed_gbps: 10,  ancestors: ['dc5', 'r9']  },
    { _id: 'nc15', serial_number: 'NC-10015', router: 'r10', location: 'Dallas, TX',      features: ['25GbE', 'QoS offload'],            port_count: 2, speed_gbps: 25,  ancestors: ['dc5', 'r10'] },
  ],

  // ── C. SINGLE COLLECTION PATTERN ────────────────────────────────────────
  single_all_network_parts: [
    { _id: 'dc1', type: 'datacenter', name: 'Data Center West',    location: 'San Jose, CA',    features: ['Tier III certified', '24/7 staffing', 'Redundant power'],   related_to: ['dc1', 'dc2', 'dc3', 'r1', 'r2'] },
    { _id: 'dc2', type: 'datacenter', name: 'Data Center South',   location: 'Los Angeles, CA', features: ['Tier III certified', 'On-site security', '25GbE uplink'],   related_to: ['dc2', 'dc1', 'dc4', 'r3', 'r4'] },
    { _id: 'dc3', type: 'datacenter', name: 'Data Center North',   location: 'Seattle, WA',     features: ['Tier II certified', '24/7 staffing', 'UPS backup'],          related_to: ['dc3', 'dc1', 'dc4', 'r5', 'r6'] },
    { _id: 'dc4', type: 'datacenter', name: 'Data Center Central', location: 'Denver, CO',      features: ['Tier III certified', 'Redundant power', 'Fire suppression'], related_to: ['dc4', 'dc2', 'dc3', 'dc5', 'r7', 'r8'] },
    { _id: 'dc5', type: 'datacenter', name: 'Data Center East',    location: 'Dallas, TX',      features: ['Tier IV certified', '24/7 staffing', 'Biometric access'],    related_to: ['dc5', 'dc4', 'r9', 'r10'] },
    { _id: 'r1',  type: 'router', hostname: 'router-west-1', location: 'San Jose, CA',    features: ['BGP', 'IPv6', 'QoS'],          related_to: ['r1',  'dc1', 'r2', 'r3', 'r5']   },
    { _id: 'r2',  type: 'router', hostname: 'router-west-2', location: 'San Jose, CA',    features: ['BGP', 'OSPF', 'Low Latency'],  related_to: ['r2',  'dc1', 'r1', 'r4']         },
    { _id: 'r3',  type: 'router', hostname: 'router-la-1',   location: 'Los Angeles, CA', features: ['MPLS', 'BGP', 'IPv6'],         related_to: ['r3',  'dc2', 'r1', 'r4', 'r6']   },
    { _id: 'r4',  type: 'router', hostname: 'router-la-2',   location: 'Los Angeles, CA', features: ['MPLS', 'QoS', 'OSPF'],         related_to: ['r4',  'dc2', 'r2', 'r3', 'r7']   },
    { _id: 'r5',  type: 'router', hostname: 'router-sea-1',  location: 'Seattle, WA',     features: ['BGP', 'IPv6', 'OSPF'],         related_to: ['r5',  'dc3', 'r1', 'r6', 'r8']   },
    { _id: 'r6',  type: 'router', hostname: 'router-sea-2',  location: 'Seattle, WA',     features: ['OSPF', 'Low Latency', 'MPLS'], related_to: ['r6',  'dc3', 'r3', 'r5', 'r9']   },
    { _id: 'r7',  type: 'router', hostname: 'router-den-1',  location: 'Denver, CO',      features: ['BGP', 'OSPF', 'IPv6'],         related_to: ['r7',  'dc4', 'r4', 'r8', 'r10']  },
    { _id: 'r8',  type: 'router', hostname: 'router-den-2',  location: 'Denver, CO',      features: ['MPLS', 'QoS', 'OSPF'],         related_to: ['r8',  'dc4', 'r5', 'r7', 'r9']   },
    { _id: 'r9',  type: 'router', hostname: 'router-dal-1',  location: 'Dallas, TX',      features: ['BGP', 'IPv6', 'MPLS'],         related_to: ['r9',  'dc5', 'r6', 'r8', 'r10']  },
    { _id: 'r10', type: 'router', hostname: 'router-dal-2',  location: 'Dallas, TX',      features: ['BGP', 'QoS', 'Low Latency'],   related_to: ['r10', 'dc5', 'r7', 'r9']         },
    { _id: 'nc1',  type: 'network_card', serial_number: 'NC-10001', location: 'San Jose, CA',    features: ['10GbE', 'SR-IOV', 'Low Latency'],  port_count: 4, speed_gbps: 10,  related_to: ['nc1',  'r1',  'dc1'] },
    { _id: 'nc2',  type: 'network_card', serial_number: 'NC-10002', location: 'San Jose, CA',    features: ['25GbE', 'RDMA'],                   port_count: 2, speed_gbps: 25,  related_to: ['nc2',  'r1',  'dc1'] },
    { _id: 'nc3',  type: 'network_card', serial_number: 'NC-10003', location: 'San Jose, CA',    features: ['10GbE', 'SR-IOV'],                 port_count: 4, speed_gbps: 10,  related_to: ['nc3',  'r2',  'dc1'] },
    { _id: 'nc4',  type: 'network_card', serial_number: 'NC-10004', location: 'Los Angeles, CA', features: ['100GbE', 'DPDK'],                  port_count: 2, speed_gbps: 100, related_to: ['nc4',  'r3',  'dc2'] },
    { _id: 'nc5',  type: 'network_card', serial_number: 'NC-10005', location: 'Los Angeles, CA', features: ['25GbE', 'RDMA', 'SR-IOV'],         port_count: 4, speed_gbps: 25,  related_to: ['nc5',  'r3',  'dc2'] },
    { _id: 'nc6',  type: 'network_card', serial_number: 'NC-10006', location: 'Los Angeles, CA', features: ['10GbE', 'Low Latency'],            port_count: 8, speed_gbps: 10,  related_to: ['nc6',  'r4',  'dc2'] },
    { _id: 'nc7',  type: 'network_card', serial_number: 'NC-10007', location: 'Seattle, WA',     features: ['25GbE', 'IPv6 offload'],           port_count: 2, speed_gbps: 25,  related_to: ['nc7',  'r5',  'dc3'] },
    { _id: 'nc8',  type: 'network_card', serial_number: 'NC-10008', location: 'Seattle, WA',     features: ['100GbE', 'DPDK', 'SR-IOV'],        port_count: 2, speed_gbps: 100, related_to: ['nc8',  'r5',  'dc3'] },
    { _id: 'nc9',  type: 'network_card', serial_number: 'NC-10009', location: 'Seattle, WA',     features: ['10GbE', 'QoS offload'],            port_count: 4, speed_gbps: 10,  related_to: ['nc9',  'r6',  'dc3'] },
    { _id: 'nc10', type: 'network_card', serial_number: 'NC-10010', location: 'Denver, CO',      features: ['25GbE', 'RDMA'],                   port_count: 4, speed_gbps: 25,  related_to: ['nc10', 'r7',  'dc4'] },
    { _id: 'nc11', type: 'network_card', serial_number: 'NC-10011', location: 'Denver, CO',      features: ['10GbE', 'SR-IOV'],                 port_count: 8, speed_gbps: 10,  related_to: ['nc11', 'r7',  'dc4'] },
    { _id: 'nc12', type: 'network_card', serial_number: 'NC-10012', location: 'Denver, CO',      features: ['100GbE', 'DPDK'],                  port_count: 2, speed_gbps: 100, related_to: ['nc12', 'r8',  'dc4'] },
    { _id: 'nc13', type: 'network_card', serial_number: 'NC-10013', location: 'Dallas, TX',      features: ['25GbE', 'RDMA', 'SR-IOV'],         port_count: 4, speed_gbps: 25,  related_to: ['nc13', 'r9',  'dc5'] },
    { _id: 'nc14', type: 'network_card', serial_number: 'NC-10014', location: 'Dallas, TX',      features: ['10GbE', 'Low Latency'],            port_count: 4, speed_gbps: 10,  related_to: ['nc14', 'r9',  'dc5'] },
    { _id: 'nc15', type: 'network_card', serial_number: 'NC-10015', location: 'Dallas, TX',      features: ['25GbE', 'QoS offload'],            port_count: 2, speed_gbps: 25,  related_to: ['nc15', 'r10', 'dc5'] },
  ],
};

async function seed() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('Connected to MongoDB.');

    // graph_lab
    const g = client.db('graph_lab');
    await g.collection('data_centers').drop().catch(() => {});
    await g.collection('routers').drop().catch(() => {});
    await g.collection('network_cards').drop().catch(() => {});
    await g.collection('data_centers').insertMany(DATA.graph_data_centers);
    await g.collection('routers').insertMany(DATA.graph_routers);
    await g.collection('network_cards').insertMany(DATA.graph_network_cards);
    console.log('✓ graph_lab seeded — data_centers:5  routers:10  network_cards:15');

    // tree_lab
    const t = client.db('tree_lab');
    await t.collection('data_centers').drop().catch(() => {});
    await t.collection('routers').drop().catch(() => {});
    await t.collection('network_cards').drop().catch(() => {});
    await t.collection('data_centers').insertMany(DATA.tree_data_centers);
    await t.collection('routers').insertMany(DATA.tree_routers);
    await t.collection('network_cards').insertMany(DATA.tree_network_cards);
    await t.collection('routers').createIndex({ ancestors: 1 });
    await t.collection('network_cards').createIndex({ ancestors: 1 });
    console.log('✓ tree_lab seeded — data_centers:5  routers:10  network_cards:15  (indexes created)');

    // single_lab
    const s = client.db('single_lab');
    await s.collection('all_network_parts').drop().catch(() => {});
    await s.collection('all_network_parts').insertMany(DATA.single_all_network_parts);
    await s.collection('all_network_parts').createIndex({ related_to: 1 });
    await s.collection('all_network_parts').createIndex({ type: 1, related_to: 1 });
    console.log('✓ single_lab seeded — all_network_parts:30  (indexes created)');

    console.log('\nAll databases seeded successfully.');
  } finally {
    await client.close();
  }
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
