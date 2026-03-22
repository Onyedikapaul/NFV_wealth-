  const API = '/api/kyc';
  let currentStep = 1;
  const totalSteps = 4;

  // Check existing KYC status on load
  window.addEventListener('DOMContentLoaded', async () => {
    try {
      const res = await fetch(`${API}/status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.ok) {
        const { kyc } = await res.json();
        showStatusBanner(kyc);

        if (kyc.status === 'pending' || kyc.status === 'approved') {
          document.getElementById('stepsBar').classList.add('hide');
          document.getElementById('kycFormCard').classList.add('hide');
        }

        // hide sidebar link if approved
        if (kyc.status === 'approved') {
          const link = document.getElementById('sidebarKycLink');
          if (link) link.style.display = 'none';
        }
      }
      // 404 means no KYC yet — show form normally
    } catch (e) {
      console.error('KYC status check failed', e);
    }
  });

  function showStatusBanner(kyc) {
    const banner = document.getElementById('statusBanner');
    banner.style.display = 'flex';
    banner.className = `kyc-status-banner ${kyc.status}`;

    const map = {
      pending:  { icon: '⏳', title: 'Verification Under Review',  msg: "Your documents have been submitted. We'll notify you once reviewed." },
      approved: { icon: '✅', title: 'Identity Verified',           msg: 'Your KYC is approved. You have full access to all features.' },
      rejected: { icon: '❌', title: 'Verification Rejected',       msg: `Reason: ${kyc.rejectionReason || 'Please resubmit with correct documents.'}` },
    };

    document.getElementById('statusIcon').textContent  = map[kyc.status].icon;
    document.getElementById('statusTitle').textContent = map[kyc.status].title;
    document.getElementById('statusMsg').textContent   = map[kyc.status].msg;

    // allow resubmission if rejected
    if (kyc.status === 'rejected') {
      document.getElementById('stepsBar').classList.remove('hide');
      document.getElementById('kycFormCard').classList.remove('hide');
    }
  }

  function setStep(n) {
    document.querySelectorAll('.form-step').forEach(s => s.classList.add('hide'));
    document.getElementById(`step${n}`).classList.remove('hide');

    document.querySelectorAll('.step-item').forEach(s => {
      const num = parseInt(s.dataset.step);
      s.classList.remove('active', 'done');
      if (num === n) s.classList.add('active');
      if (num < n)  s.classList.add('done');
    });

    document.getElementById('btnBack').style.display = n > 1 ? 'inline-flex' : 'none';

    const btnNext = document.getElementById('btnNext');
    if (n === totalSteps) {
      btnNext.textContent = 'Submit Verification';
      btnNext.className   = 'btn btn-success';
      btnNext.onclick     = submitKYC;
      populateReview();
    } else {
      btnNext.textContent = 'Continue →';
      btnNext.className   = 'btn btn-primary';
      btnNext.onclick     = nextStep;
    }

    currentStep = n;
  }

  function nextStep() {
    if (!validateStep(currentStep)) return;
    if (currentStep < totalSteps) setStep(currentStep + 1);
  }

  function prevStep() {
    if (currentStep > 1) setStep(currentStep - 1);
  }

  function validateStep(step) {
    if (step === 1) {
      if (!document.getElementById('fullName').value.trim() ||
          !document.getElementById('dob').value ||
          !document.getElementById('phone').value.trim() ||
          !document.getElementById('country').value.trim() ||
          !document.getElementById('address').value.trim()) {
        showToast('Please fill in all personal details', 'error');
        return false;
      }
    }
    if (step === 2) {
      if (!document.getElementById('idType').value ||
          !document.getElementById('idNumber').value.trim()) {
        showToast('Please select ID type and enter ID number', 'error');
        return false;
      }
    }
    if (step === 3) {
      if (!document.getElementById('idDocument').files[0] ||
          !document.getElementById('selfie').files[0]) {
        showToast('Please upload both your ID document and selfie', 'error');
        return false;
      }
    }
    if (step === 4) {
      if (!document.getElementById('consent').checked) {
        showToast('Please confirm the consent checkbox', 'error');
        return false;
      }
    }
    return true;
  }

  function populateReview() {
    document.getElementById('r_fullName').textContent = document.getElementById('fullName').value;
    document.getElementById('r_dob').textContent      = document.getElementById('dob').value;
    document.getElementById('r_phone').textContent    = document.getElementById('phone').value;
    document.getElementById('r_country').textContent  = document.getElementById('country').value;
    document.getElementById('r_address').textContent  = document.getElementById('address').value;
    document.getElementById('r_idType').textContent   = document.getElementById('idType').value;
    document.getElementById('r_idNumber').textContent = document.getElementById('idNumber').value;

    const idDoc  = document.getElementById('idDocument').files[0];
    const selfie = document.getElementById('selfie').files[0];
    document.getElementById('r_idDoc').textContent  = idDoc  ? '✔ ' + idDoc.name  : 'Not uploaded';
    document.getElementById('r_selfie').textContent = selfie ? '✔ ' + selfie.name : 'Not uploaded';
  }

  document.getElementById('idDocument').addEventListener('change', function () {
    if (this.files[0]) {
      document.getElementById('idDocZone').classList.add('has-file');
      document.getElementById('idDocName').textContent = '✔ ' + this.files[0].name;
    }
  });

  document.getElementById('selfie').addEventListener('change', function () {
    if (this.files[0]) {
      document.getElementById('selfieZone').classList.add('has-file');
      document.getElementById('selfieName').textContent = '✔ ' + this.files[0].name;
    }
  });

  async function submitKYC() {
    if (!validateStep(4)) return;

    const btn = document.getElementById('btnNext');
    btn.disabled = true;
    btn.innerHTML = '<div class="spinner"></div> Submitting...';

    const formData = new FormData();
    formData.append('fullName',   document.getElementById('fullName').value.trim());
    formData.append('dob',        document.getElementById('dob').value);
    formData.append('phone',      document.getElementById('phone').value.trim());
    formData.append('country',    document.getElementById('country').value.trim());
    formData.append('address',    document.getElementById('address').value.trim());
    formData.append('idType',     document.getElementById('idType').value);
    formData.append('idNumber',   document.getElementById('idNumber').value.trim());
    formData.append('idDocument', document.getElementById('idDocument').files[0]);
    formData.append('selfie',     document.getElementById('selfie').files[0]);

    try {
      const res = await fetch(`${API}/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        showToast('KYC submitted successfully!', 'success');
        showStatusBanner({ status: 'pending' });
        document.getElementById('stepsBar').classList.add('hide');
        document.getElementById('kycFormCard').classList.add('hide');
        const link = document.getElementById('sidebarKycLink');
        if (link) link.style.display = 'none';
      } else {
        showToast(data.message || 'Submission failed', 'error');
        btn.disabled = false;
        btn.innerHTML = 'Submit Verification';
      }
    } catch (e) {
      console.error(e);
      showToast('Network error. Please try again.', 'error');
      btn.disabled = false;
      btn.innerHTML = 'Submit Verification';
    }
  }

  function showToast(msg, type = 'success') {
    let toast = document.getElementById('kycToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'kycToast';
      toast.style.cssText = `
        position:fixed; bottom:28px; right:28px; padding:13px 20px;
        border-radius:10px; font-size:14px; font-weight:500; z-index:9999;
        transition:all 0.3s ease; opacity:0; transform:translateY(12px);
        max-width:320px; font-family:inherit;
      `;
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.background = type === 'success' ? '#22c55e' : '#ef4444';
    toast.style.color = '#fff';
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
    }, 3500);
  }
