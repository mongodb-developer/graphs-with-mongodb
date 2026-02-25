# Modeling Graphs with MongoDB

Companion lab material for the presentation *Modeling Graphs with MongoDB*.

The lab demonstrates three distinct patterns for representing and querying graph-structured data in MongoDB, using a network equipment topology as the domain model.

---

## Contents

```
.devcontainer/        Codespaces / Dev Container configuration
  Dockerfile          Jupyter base image extended with Node.js and tslab
  docker-compose.yml  MongoDB Atlas Local + lab runner services
  devcontainer.json   Dev Container metadata
  seed.js             Database seed script (runs on container creation)

data/                 Reference JSON data files
  graph_pattern/      Graph Pattern dataset
  tree_pattern/       Tree Pattern dataset
  single_collection/  Single Collection Pattern dataset

lab/                  TypeScript Jupyter notebooks
  01_graph_pattern.ipynb
  02_tree_pattern.ipynb
  03_single_collection.ipynb
```

---

## Domain Model

The three labs share the same underlying dataset: a wide-area network with five data centers, ten routers, and fifteen network cards. The data is identical across all labs; only the document structure differs.

**Data centers** — `dc1` through `dc5`, located in San Jose, Los Angeles, Seattle, Denver, and Dallas. Each has a set of facility features and connections to peer data centers.

**Routers** — `r1` through `r10`, two per data center. Each has a set of protocol features and connections to peer routers across the network.

**Network cards** — `nc1` through `nc15`, one to two per router. Each has a speed, port count, and a set of hardware features.

---

## Patterns

### A. Graph Pattern

**Database:** `graph_lab` — **Collections:** `data_centers`, `routers`, `network_cards`

Each document stores an array of directly connected peer IDs (`connected_datacenters`, `connected_routers`). Traversal is performed with MongoDB's `$graphLookup` aggregation stage, which follows those arrays recursively up to a configurable depth.

Suitable for peer-to-peer graphs where relationships are many-to-many and traversal depth is variable.

### B. Tree Pattern

**Database:** `tree_lab` — **Collections:** `data_centers`, `routers`, `network_cards`

Each document stores an `ancestors` array containing the IDs of all nodes above it in the hierarchy. A multi-key index on `ancestors` allows all descendants of any node to be retrieved with a single indexed query, without recursion.

Suitable for strict hierarchies where reads are frequent and write overhead on node moves is acceptable.

### C. Single Collection Pattern

**Database:** `single_lab` — **Collection:** `all_network_parts`

All entity types are stored in one collection. Each document has a `type` field (`datacenter`, `router`, `network_card`) and a `related_to` array listing all directly related node IDs. A multi-key index on `related_to` supports fast lookups of any element's neighbourhood.

Suitable for mixed or many-to-many relationships where a single collection simplifies queries and schema management.

---

## Prerequisites

- Docker Desktop
- A Dev Container-compatible environment (GitHub Codespaces or a local IDE with Dev Containers support)

---

## Running the Lab

### GitHub Codespaces

1. Open the repository in GitHub Codespaces. The Dev Container will build automatically.
2. Once the container is ready, `npm install` and the seed script run automatically via `postCreateCommand`.
3. Open any notebook in `lab/` and select the **TypeScript** kernel.

### Local

1. Open the repository in an IDE that supports Dev Containers (VS Code with the Dev Containers extension, or JetBrains Gateway).
2. Reopen the project in the container. The build and seed steps run automatically.
3. Open any notebook in `lab/` and select the **TypeScript** kernel.

### Verifying the seed (optional)

To confirm the databases are populated before opening a notebook, start only the MongoDB service and run the seed script manually:

```bash
# Start MongoDB
docker compose -f .devcontainer/docker-compose.yml up mongodb -d

# Wait for the health check to pass, then seed
npm install
MONGODB_URI="mongodb://admin:mongodb@localhost:27017/?directConnection=true" node .devcontainer/seed.js

# Tear down when done
docker compose -f .devcontainer/docker-compose.yml down -v
```

Expected output:

```
Connected to MongoDB.
✓ graph_lab seeded — data_centers:5  routers:10  network_cards:15
✓ tree_lab seeded — data_centers:5  routers:10  network_cards:15  (indexes created)
✓ single_lab seeded — all_network_parts:30  (indexes created)

All databases seeded successfully.
```

---

## Connection Details

| Parameter | Value |
|---|---|
| Host | `localhost:27017` |
| Username | `admin` |
| Password | `mongodb` |
| Connection string | `mongodb://admin:mongodb@localhost:27017/?directConnection=true` |

The `directConnection=true` parameter is required because MongoDB Atlas Local runs as a single-node replica set and advertises the container hostname in its replica set configuration. Without it, the driver will attempt to resolve the container hostname from the host network, which fails.

---

## Lab Notebooks

Each notebook is self-contained and follows the same structure: a brief explanation of the pattern, exercises that build from simple document inspection to progressively more complex queries, and a summary of trade-offs.

| Notebook | Pattern | Key operations |
|---|---|---|
| `01_graph_pattern.ipynb` | Graph | `$graphLookup`, `maxDepth`, hop counting, cross-collection pipeline |
| `02_tree_pattern.ipynb` | Tree | Multi-key index, `find({ ancestors: id })`, `explain()` |
| `03_single_collection.ipynb` | Single Collection | `find({ related_to: id })`, `type` filter, aggregation |

---

## Technical Stack

| Component | Technology |
|---|---|
| Database | MongoDB Atlas Local 8.2.0 |
| Notebook runtime | Jupyter (tslab — TypeScript kernel for Jupyter) |
| MongoDB driver | mongodb Node.js driver v6 |
| Container base image | jupyter/base-notebook with Node.js 20 |
