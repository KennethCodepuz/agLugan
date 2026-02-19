package com.aglugan.backend.auth;

import com.aglugan.backend.auth.authDTO.GoogleTokenDTO;
import com.aglugan.backend.auth.authDTO.GoogleUserDTO;
import com.aglugan.backend.auth.authDTO.ResultDTO;
import com.aglugan.backend.auth.authDTO.SecondInformationDTO;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth2")
public class AuthController {


    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

//    verify google token first
    @PostMapping("/google/verifyToken")
    public ResponseEntity<?> verifyGoogleUser(@RequestBody GoogleTokenDTO token) {

        String tempToken = authService.verifyToken(token.getIdToken());
        System.out.println("Temp token1: " + tempToken);

        if(tempToken == null || tempToken.isEmpty()) {
            return ResponseEntity.status(400).body("Invalid Google Token");
        }

        System.out.println("Temp token: " + tempToken);

        return ResponseEntity.ok(tempToken);
    }

// Registration Method
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody @Valid SecondInformationDTO secondInformation) {

        ResultDTO result = authService.registerUserLogic(secondInformation);

        System.out.println(secondInformation);

        if (!result.isGoogleUserSuccess()) {
            return ResponseEntity.status(401).body(result.getErrorMessage());
        }

        System.out.println("User successfuly registered");

        return ResponseEntity.ok(result.getUser());
    }


//    Login Method
    @PostMapping("/login")
    public ResponseEntity<?> loginUser(@RequestBody @Valid GoogleTokenDTO token) {

        ResultDTO result = authService.loginUserLogic(token.getIdToken());

        if (!result.isUserSuccess()) {
            return ResponseEntity.status(401).body(result);
        }

        System.out.println("User successfuly logged in");
        System.out.println(result);

        return ResponseEntity.ok(result.getUser());
    }

}
