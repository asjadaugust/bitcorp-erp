import { Router } from 'express';
import Contract from '../models/Contract';
import ContractAddendum from '../models/ContractAddendum';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Get all contracts
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, equipmentId, providerId } = req.query;
    const where: any = {};
    
    if (status) where.status = status;
    if (equipmentId) where.equipmentId = equipmentId;
    if (providerId) where.providerId = providerId;

    const contracts = await Contract.findAll({
      where,
      order: [['endDate', 'ASC']],
    });

    res.json(contracts);
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ message: 'Error fetching contracts' });
  }
});

// Get contract by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    res.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ message: 'Error fetching contract' });
  }
});

// Create new contract
router.post('/', authenticate, async (req, res) => {
  try {
    const contract = await Contract.create({
      ...req.body,
      createdBy: req.user.id,
    });
    res.status(201).json(contract);
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ message: 'Error creating contract' });
  }
});

// Update contract
router.put('/:id', authenticate, async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    await contract.update(req.body);
    res.json(contract);
  } catch (error) {
    console.error('Error updating contract:', error);
    res.status(500).json({ message: 'Error updating contract' });
  }
});

// Delete contract
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }
    await contract.destroy();
    res.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    res.status(500).json({ message: 'Error deleting contract' });
  }
});

// Get contract addendums
router.get('/:id/addendums', authenticate, async (req, res) => {
  try {
    const addendums = await ContractAddendum.findAll({
      where: { contractId: req.params.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(addendums);
  } catch (error) {
    console.error('Error fetching addendums:', error);
    res.status(500).json({ message: 'Error fetching addendums' });
  }
});

// Create contract addendum
router.post('/:id/addendums', authenticate, async (req, res) => {
  try {
    const contract = await Contract.findByPk(req.params.id);
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Generate addendum number
    const addendumCount = await ContractAddendum.count({
      where: { contractId: contract.id },
    });
    const addendumNumber = `${contract.contractNumber}-AD-${String(addendumCount + 1).padStart(3, '0')}`;

    const addendum = await ContractAddendum.create({
      ...req.body,
      addendumNumber,
      contractId: contract.id,
      createdBy: req.user.id,
    });

    // Update contract status and end date
    await contract.update({
      endDate: req.body.newEndDate,
      status: 'extended',
    });

    res.status(201).json(addendum);
  } catch (error) {
    console.error('Error creating addendum:', error);
    res.status(500).json({ message: 'Error creating addendum' });
  }
});

// Update contract statuses (cron job endpoint)
router.post('/update-statuses', authenticate, async (req, res) => {
  try {
    const contracts = await Contract.findAll();
    for (const contract of contracts) {
      contract.updateStatus();
      await contract.save();
    }
    res.json({ message: 'Contract statuses updated', count: contracts.length });
  } catch (error) {
    console.error('Error updating statuses:', error);
    res.status(500).json({ message: 'Error updating statuses' });
  }
});

export default router;
