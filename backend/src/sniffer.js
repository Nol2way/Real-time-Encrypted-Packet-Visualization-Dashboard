import { createRequire } from 'module';
import batcher from './batcher.js';

const require = createRequire(import.meta.url);
const { Cap, decoders } = require('cap');

// Protocol constants (ใช้ hardcode เพราะ PROTOCOL export อาจ undefined ใน cap บางเวอร์ชัน)
const PROTO_IPV4    = 0x0800;
const PROTO_TCP     = 6;
const PROTO_UDP     = 17;
const PROTO_ICMP    = 1;

// Detect TLS version from raw payload bytes
const detectTlsVersion = (buf, offset) => {
  if (!buf || buf.length <= offset + 3) return null;
  if (buf[offset] === 0x16) { // TLS Content Type: Handshake
    const major = buf[offset + 1];
    const minor = buf[offset + 2];
    if (major === 3) {
      if (minor === 0) return 'SSL 3.0';
      if (minor === 1) return 'TLS 1.0';
      if (minor === 2) return 'TLS 1.1';
      if (minor === 3) return 'TLS 1.2';
      if (minor === 4) return 'TLS 1.3';
    }
  }
  return null;
};

// Map port number to protocol name
const getProtocolByPort = (srcPort, dstPort, baseProto) => {
  const ports = new Set([srcPort, dstPort]);
  if (baseProto === 'TCP') {
    if (ports.has(80) || ports.has(8080) || ports.has(8000) || ports.has(3000) || ports.has(3001)) return 'HTTP';
    if (ports.has(443) || ports.has(8443)) return 'HTTPS';
    if (ports.has(22)) return 'SSH';
    if (ports.has(21)) return 'FTP';
    if (ports.has(25) || ports.has(587) || ports.has(465)) return 'SMTP';
    if (ports.has(110)) return 'POP3';
    if (ports.has(143)) return 'IMAP';
    if (ports.has(3306)) return 'MySQL';
    if (ports.has(5432)) return 'PostgreSQL';
    if (ports.has(6379)) return 'Redis';
    if (ports.has(27017)) return 'MongoDB';
    return 'TCP';
  }
  if (baseProto === 'UDP') {
    if (ports.has(53)) return 'DNS';
    if (ports.has(67) || ports.has(68)) return 'DHCP';
    if (ports.has(123)) return 'NTP';
    if (ports.has(161)) return 'SNMP';
    return 'UDP';
  }
  return baseProto;
};

export const startSniffing = () => {
  try {
    const devices = Cap.deviceList();

    if (!devices || devices.length === 0) {
      throw new Error('ไม่พบ network interface');
    }

    // เลือก en0 (Wi-Fi บน macOS) ก่อน ถ้าไม่มีเลือก non-loopback แรก
    const device =
      devices.find(d => d.name === 'en0') ||
      devices.find(d => d.name && !d.name.startsWith('lo')) ||
      devices[0];

    console.log(`[Sniffer] กำลังดักจับบน interface: ${device.name}`);

    const c = new Cap();
    const bufSize = 10 * 1024 * 1024; // 10 MB buffer
    const buffer = Buffer.alloc(65535);

    // BPF filter: เฉพาะ IPv4
    const linkType = c.open(device.name, 'ip', bufSize, buffer);
    if (c.setMinBytes) c.setMinBytes(0);

    let packetCount = 0;

    c.on('packet', (nbytes) => {
      try {
        if (linkType !== 'ETHERNET') return;

        // Decode Ethernet
        const eth = decoders.Ethernet(buffer);
        if (eth.info.type !== PROTO_IPV4) return;

        // Decode IPv4
        const ip = decoders.IPV4(buffer, eth.offset);
        const srcIp = ip.info.srcaddr;
        const dstIp = ip.info.dstaddr;
        const proto = ip.info.protocol;

        let protocol = 'IP';
        let srcPort = 0;
        let dstPort = 0;
        let tlsVersion = null;

        if (proto === PROTO_TCP) {
          const tcp = decoders.TCP(buffer, ip.offset);
          srcPort = tcp.info.srcport;
          dstPort = tcp.info.dstport;
          protocol = getProtocolByPort(srcPort, dstPort, 'TCP');
          if (protocol === 'HTTPS') {
            tlsVersion = detectTlsVersion(buffer, tcp.offset);
          }
        } else if (proto === PROTO_UDP) {
          const udp = decoders.UDP(buffer, ip.offset);
          srcPort = udp.info.srcport;
          dstPort = udp.info.dstport;
          protocol = getProtocolByPort(srcPort, dstPort, 'UDP');
        } else if (proto === PROTO_ICMP) {
          protocol = 'ICMP';
        } else {
          return;
        }

        packetCount++;
        if (packetCount % 100 === 0) {
          console.log(`[Sniffer] จับได้ ${packetCount} packets...`);
        }

        batcher.addPacket({
          timestamp: Date.now(),
          src_ip: srcIp,
          src_port: srcPort,
          dst_ip: dstIp,
          dst_port: dstPort,
          protocol,
          size: nbytes,
          tls_version: tlsVersion,
          info: `Live ${protocol}`
        });

      } catch (_) {
        // ข้าม packet ที่ parse ไม่ได้
      }
    });

    c.on('error', (err) => {
      console.error('[Sniffer] Capture error:', err.message);
    });

    console.log('[Sniffer] Live packet capture เริ่มทำงานแล้ว!');

  } catch (err) {
    console.error(`[Sniffer] ERROR: ${err.message}`);
    if (
      err.message.toLowerCase().includes('permission') ||
      err.message.toLowerCase().includes('eacces') ||
      (err.code && err.code === 'EACCES')
    ) {
      console.error('');
      console.error('[Sniffer] ⚠️  ไม่มีสิทธิ์เข้าถึง BPF device');
      console.error('[Sniffer] รันด้วย:  sudo npm start');
      console.error('[Sniffer] หรือเปิดสิทธิ์ถาวร: sudo chmod o+r /dev/bpf*');
    }
    process.exit(1);
  }
};
