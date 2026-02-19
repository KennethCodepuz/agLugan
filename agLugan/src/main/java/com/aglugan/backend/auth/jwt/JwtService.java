package com.aglugan.backend.auth.jwt;

import com.aglugan.backend.auth.authDTO.GoogleUserDTO;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Value;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtService {

    @Value("${jwt.temp.token}")
    public String tempKey;

    //    generate token for temporary key
    public String generateToken(GoogleUserDTO googleUser) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", googleUser.getEmail());
        claims.put("name", googleUser.getName());
        claims.put("googleSub", googleUser.getGoogleSub());
        claims.put("profilePicture", googleUser.getProfilePicture());
        return createToken(claims, googleUser);
    }

    public String createToken(Map<String, Object> claims, GoogleUserDTO googleUser) {
        return Jwts.builder()
                .claims(claims)
                .subject(googleUser.getGoogleSub())
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 30))
                .signWith(getSignKey())
                .compact();
    }

    private SecretKey getSignKey() {
        byte[] keyBytes = Decoders.BASE64.decode(tempKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
