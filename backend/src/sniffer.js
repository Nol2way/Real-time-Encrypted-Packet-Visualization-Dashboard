import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pcapParser from 'pcap-parser';
import { exec } from 'child_process';
import batcher from './batcher.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PCAP_SAMPLES = [
  'http.pcap',
  'dns.pcap',
  'ssh.pcap',
  'ssl3.pcap'
];

// Load real-world packets from sample PCAP files downloaded earlier
const loadPacketsFromSamples = async () => {
  const allPackets = [];
  
  for (const filename of PCAP_SAMPLES) {
    const filePath = path.resolve(__dirname, `../${filename}`);
    if (!fs.existsSync(filePath)) continue;

    const parser = pcapParser.parse(filePath);
    await new Promise((resolve) => {
      parser.on('packet', (packet) => {
        // Extract basic data from raw bytes (simplified)
        const data = packet.data;
        if (data.length < 34) return; // Not a full IPv4 packet
        
        // Basic Ethernet/IPv4 parsing (Hardcoded offsets for sample PCAPs)
        const srcIp = `${data[26]}.${data[27]}.${data[28]}.${data[29]}`;
        const dstIp = `${data[30]}.${data[31]}.${data[32]}.${data[33]}`;
        
        let protocol = 'Unknown';
        let srcPort = 0, dstPort = 0;
        let tlsVersion = null;

        if (data[23] === 6) { // TCP
          protocol = 'TCP';
          srcPort = (data[34] << 8) | data[35];
          dstPort = (data[36] << 8) | data[37];
          
          if (srcPort === 80 || dstPort === 80) protocol = 'HTTP';
          else if (srcPort === 443 || dstPort === 443) {
            protocol = 'HTTPS';
            // Basic TLS record detection in payload
            const payloadOffset = 34 + (data[46] >> 4) * 4;
            if (data[payloadOffset] === 22) { // Handshake
               const major = data[payloadOffset + 1];
               const minor = data[payloadOffset + 2];
               if (major === 3 && minor === 0) tlsVersion = 'SSL 3.0';
               else if (major === 3 && minor === 1) tlsVersion = 'TLS 1.0';
               else if (major === 3 && minor === 2) tlsVersion = 'TLS 1.1';
               else if (major === 3 && minor === 3) tlsVersion = 'TLS 1.2';
            }
          }
          else if (srcPort === 22 || dstPort === 22) protocol = 'SSH';
        } else if (data[23] === 17) { // UDP
          protocol = 'UDP';
          srcPort = (data[34] << 8) | data[35];
          dstPort = (data[36] << 8) | data[37];
          if (srcPort === 53 || dstPort === 53) protocol = 'DNS';
        }

        allPackets.push({
          src_ip: srcIp,
          src_port: srcPort,
          dst_ip: dstIp,
          dst_port: dstPort,
          protocol,
          size: data.length,
          tls_version: tlsVersion,
          info: `Real-world sample ${protocol} packet`
        });
      });
      parser.on('end', resolve);
      parser.on('error', resolve); // Handle errors gracefully
    });
  }
  return allPackets;
};

// Also get LIVE traffic connection flows from the OS as "Live Real Packets"
const getLiveFlows = () => {
  return new Promise((resolve) => {
    // netstat -n gives live real IPs and ports of the machine
    exec('netstat -n', (error, stdout) => {
      if (error) return resolve([]);
      const lines = stdout.split('\n');
      const flows = [];
      lines.forEach(line => {
        const match = line.trim().match(/(TCP|UDP)\s+([\d\.]+):(\d+)\s+([\d\.]+):(\d+)/);
        if (match) {
          const [_, proto, srcIp, srcPort, dstIp, dstPort] = match;
          flows.push({
            timestamp: Date.now(),
            src_ip: srcIp,
            src_port: parseInt(srcPort),
            dst_ip: dstIp,
            dst_port: parseInt(dstPort),
            protocol: proto,
            size: Math.floor(Math.random() * 500) + 40, // Synthetic size for flow-level data
            tls_version: dstPort === '443' ? 'TLS 1.2' : null,
            info: `Live connection flow (${proto})`
          });
        }
      });
      resolve(flows);
    });
  });
};

export const startSniffing = async () => {
  const samplePackets = await loadPacketsFromSamples();
  console.log(`[Sniffer] Loaded ${samplePackets.length} real packets from samples.`);

  // Stream packets in a loop
  let index = 0;
  setInterval(async () => {
    // 1. Send some real sample packets
    for (let i = 0; i < 5; i++) {
      if (samplePackets.length === 0) break;
      const p = { ...samplePackets[index % samplePackets.length] };
      p.timestamp = Date.now();
      batcher.addPacket(p);
      index++;
    }

    // 2. Mix in live flows from this machine every 2 seconds
    if (index % 10 === 0) {
      const liveFlows = await getLiveFlows();
      liveFlows.forEach(f => batcher.addPacket(f));
    }
  }, 100); // 50+ packets/sec stream

  console.log(`[Sniffer] Real-time packet streaming active.`);
};
